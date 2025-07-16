
import React, { useState } from 'react';
import { AttackGroup as AttackGroupType, AttackAction, ActionType } from '../types';
import { AttackActionCard } from './AttackAction';
import { AddEditActionModal } from './AddEditActionModal';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';


interface AttackGroupProps {
  group: AttackGroupType;
  defaultTargetUri?: string; // Added to pass down
  onUpdateGroup: (groupId: string, name: string, description?: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddAction: (groupId: string, action: Omit<AttackAction, 'id'>) => void;
  onUpdateAction: (groupId: string, actionId: string, updatedAction: Omit<AttackAction, 'id'>) => void;
  onDeleteAction: (groupId: string, actionId: string) => void;
  onEditGroup: () => void;
}

export const AttackGroup: React.FC<AttackGroupProps> = ({
  group,
  defaultTargetUri, // Consumed here
  onEditGroup,
  onDeleteGroup,
  onAddAction,
  onUpdateAction,
  onDeleteAction,
}) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<AttackAction | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleOpenAddActionModal = () => {
    setEditingAction(null);
    setIsActionModalOpen(true);
  };

  const handleOpenEditActionModal = (action: AttackAction) => {
    setEditingAction(action);
    setIsActionModalOpen(true);
  };

  const handleSaveAction = (actionData: Omit<AttackAction, 'id'>) => {
    if (editingAction) {
      onUpdateAction(group.id, editingAction.id, actionData);
    } else {
      onAddAction(group.id, actionData);
    }
  };
  
  const handleDeleteGroupWithConfirmation = () => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}" and all its actions? This cannot be undone.`)) {
      onDeleteGroup(group.id);
    }
  };
  
  const handleDeleteActionWithConfirmation = (actionId: string, actionName: string) => {
     if (window.confirm(`Are you sure you want to delete the action "${actionName}"? This cannot be undone.`)) {
      onDeleteAction(group.id, actionId);
    }
  };


  return (
    <div className="mb-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700/50 overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-neutral-100 dark:bg-neutral-700/60 border-b border-neutral-200 dark:border-neutral-700 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-primary-700 dark:text-primary-400 truncate" title={group.name}>
              {group.name}
            </h2>
            {group.description && <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate" title={group.description}>{group.description}</p>}
        </div>
        <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
          <button
            onClick={(e) => {e.stopPropagation(); handleOpenAddActionModal();}}
            title="Add New Action"
            className="p-2 rounded-full text-white bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {e.stopPropagation(); onEditGroup();}}
            title="Edit Group"
            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-neutral-600 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {e.stopPropagation(); handleDeleteGroupWithConfirmation();}}
            title="Delete Group"
            className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-neutral-600 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <button 
            className="p-2 rounded-full text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            title={isExpanded ? "Collapse Group" : "Expand Group"}
          >
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-6">
          {group.actions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.actions.map((action) => (
                <AttackActionCard
                  key={action.id}
                  action={action}
                  defaultTargetUri={defaultTargetUri} // Passed down
                  onEdit={() => handleOpenEditActionModal(action)}
                  onDelete={() => handleDeleteActionWithConfirmation(action.id, action.name)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-6 text-sm">
              No actions defined for this group yet. Click the <PlusIcon className="w-4 h-4 inline-block -mt-1"/> button above to add one.
            </p>
          )}
        </div>
      )}

      <AddEditActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSave={handleSaveAction}
        action={editingAction}
        defaultTargetUri={defaultTargetUri} // Pass to modal for info
      />
    </div>
  );
};