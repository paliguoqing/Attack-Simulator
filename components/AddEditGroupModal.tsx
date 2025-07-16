
import React, { useState, useEffect, FormEvent } from 'react';
import { Modal } from './Modal';
import { AttackGroup } from '../types';

interface AddEditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
  group?: AttackGroup | null; // For editing
}

export const AddEditGroupModal: React.FC<AddEditGroupModalProps> = ({ isOpen, onClose, onSave, group }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [group, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Group name cannot be empty.");
      return;
    }
    onSave(name.trim(), description.trim() || undefined);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group ? 'Edit Attack Group' : 'Add New Attack Group'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="groupName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-neutral-700 dark:text-neutral-50"
          />
        </div>
        <div>
          <label htmlFor="groupDescription" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Description (Optional)
          </label>
          <textarea
            id="groupDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-neutral-700 dark:text-neutral-50"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800"
          >
            {group ? 'Save Changes' : 'Add Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
