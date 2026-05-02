"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  TransactionCard,
  type TransactionCardProps,
} from "@/components/ui/transaction-card";
import { cn } from "@/lib/utils/cn";

export type PipelineColumnId =
  | "listing"
  | "contract"
  | "pending"
  | "prelisting"
  | "closed";

export type PipelineCard = {
  id: string;
} & Pick<
  TransactionCardProps,
  "address" | "closeDateLabel" | "tcInitials" | "progressPercent" | "stage"
>;

const COLUMN_META: { id: PipelineColumnId; label: string }[] = [
  { id: "listing", label: "Active listing" },
  { id: "contract", label: "Under contract" },
  { id: "pending", label: "Pending" },
  { id: "prelisting", label: "Pre-listing" },
  { id: "closed", label: "Closed" },
];

function Column({
  id,
  title,
  children,
}: {
  id: PipelineColumnId;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[min(360px,70vh)] w-[min(280px,72vw)] shrink-0 flex-col gap-3 rounded-brand-lg border border-neutral-300 bg-neutral-100 p-3 shadow-brand-sm",
        isOver && "ring-2 ring-brand-gold ring-offset-2 ring-offset-neutral-50",
      )}
    >
      <h4 className="border-b border-neutral-300 pb-2 font-display text-sm font-semibold text-brand-navy">
        {title}
      </h4>
      <div className="flex flex-col gap-3 overflow-y-auto">{children}</div>
    </div>
  );
}

function DraggableCard({
  card,
  activeId,
}: {
  card: PipelineCard;
  activeId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
    data: { card },
  });
  const dragging = activeId === card.id;
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        dragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
    >
      <TransactionCard
        address={card.address}
        closeDateLabel={card.closeDateLabel}
        tcInitials={card.tcInitials}
        progressPercent={card.progressPercent}
        stage={card.stage}
      />
    </div>
  );
}

function moveCard(
  cols: Record<PipelineColumnId, PipelineCard[]>,
  cardId: string,
  target: PipelineColumnId,
): Record<PipelineColumnId, PipelineCard[]> {
  let found: PipelineCard | undefined;
  const next: Record<PipelineColumnId, PipelineCard[]> = {
    listing: [...cols.listing],
    contract: [...cols.contract],
    pending: [...cols.pending],
    prelisting: [...cols.prelisting],
    closed: [...cols.closed],
  };
  (Object.keys(next) as PipelineColumnId[]).forEach((k) => {
    const i = next[k].findIndex((c) => c.id === cardId);
    if (i >= 0) {
      found = next[k][i];
      next[k] = next[k].filter((c) => c.id !== cardId);
    }
  });
  if (!found) return cols;
  next[target] = [...next[target], found];
  return next;
}

export interface TcPipelineKanbanProps {
  initialColumns: Record<PipelineColumnId, PipelineCard[]>;
  /** TODO: replace with server mutation + optimistic UI */
  onColumnsChange?: (next: Record<PipelineColumnId, PipelineCard[]>) => void;
}

/**
 * Horizontal pipeline — drag cards between columns; overlay scales per spec.
 */
export function TcPipelineKanban({
  initialColumns,
  onColumnsChange,
}: TcPipelineKanbanProps) {
  const [columns, setColumns] = React.useState(initialColumns);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );

  const activeCard = React.useMemo(() => {
    if (!activeId) return null;
    for (const col of Object.values(columns)) {
      const c = col.find((x) => x.id === activeId);
      if (c) return c;
    }
    return null;
  }, [activeId, columns]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const cardId = String(active.id);
    const overId = String(over.id);
    setColumns((prev) => {
      let targetCol = COLUMN_META.find((c) => c.id === overId)?.id;
      if (!targetCol) {
        for (const k of Object.keys(prev) as PipelineColumnId[]) {
          if (prev[k].some((c) => c.id === overId)) {
            targetCol = k;
            break;
          }
        }
      }
      if (!targetCol) return prev;
      const next = moveCard(prev, cardId, targetCol);
      onColumnsChange?.(next);
      return next;
    });
  }

  function onDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5">
        {COLUMN_META.map((col) => (
          <Column key={col.id} id={col.id} title={col.label}>
            {columns[col.id].map((card) => (
              <DraggableCard key={card.id} card={card} activeId={activeId} />
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeCard ? (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="cursor-grabbing shadow-brand-lg"
          >
            <TransactionCard
              address={activeCard.address}
              closeDateLabel={activeCard.closeDateLabel}
              tcInitials={activeCard.tcInitials}
              progressPercent={activeCard.progressPercent}
              stage={activeCard.stage}
            />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export { COLUMN_META };
