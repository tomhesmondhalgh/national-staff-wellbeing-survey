
import React from 'react';
import DescriptorRow from './DescriptorRow';
import { ActionPlanDescriptor, DescriptorStatus } from '@/types/actionPlan';

interface DescriptorsTableProps {
  descriptors: ActionPlanDescriptor[];
  editingCell: { id: string; field: string } | null;
  editValue: string;
  onEditStart: (id: string, field: string, value: string) => void;
  onEditValueChange: (value: string) => void;
  onEditSave: () => void;
  onStatusChange: (id: string, status: DescriptorStatus) => void;
  onDateChange: (id: string, date: string) => void;
  onViewNotes: (id: string) => void;
  onAddNote: (id: string) => void;
}

const DescriptorsTable: React.FC<DescriptorsTableProps> = ({
  descriptors,
  editingCell,
  editValue,
  onEditStart,
  onEditValueChange,
  onEditSave,
  onStatusChange,
  onDateChange,
  onViewNotes,
  onAddNote
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-16">Index</th>
            <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-1/4">Descriptor</th>
            <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-44">Status & Deadline</th>
            <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-32">Assigned To</th>
            <th className="p-2 text-left font-medium text-gray-600 border border-gray-200">Key Actions</th>
            <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-28">Notes</th>
          </tr>
        </thead>
        <tbody>
          {descriptors.map((descriptor) => (
            <DescriptorRow
              key={descriptor.id}
              descriptor={descriptor}
              editingCell={editingCell}
              editValue={editValue}
              onEditStart={onEditStart}
              onEditValueChange={onEditValueChange}
              onEditSave={onEditSave}
              onStatusChange={onStatusChange}
              onDateChange={onDateChange}
              onViewNotes={onViewNotes}
              onAddNote={onAddNote}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DescriptorsTable;
