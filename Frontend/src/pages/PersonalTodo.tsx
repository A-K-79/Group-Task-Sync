import React, { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Edit, Save, Trash, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PersonalTodo = () => {
  const {
    personalTasks,
    assignedProjectTasks,
    createPersonalTask,
    editPersonalTask,
    togglePersonalTask,
    deletePersonalTask,
    completeAssignedTask,
  } = useProjects();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const sortedPersonalTasks = useMemo(
    () => [...personalTasks].sort((a, b) => Number(a.completed) - Number(b.completed)),
    [personalTasks]
  );

  const handleCreatePersonalTask = () => {
    if (!title.trim()) return;
    createPersonalTask(title.trim(), description.trim());
    setTitle('');
    setDescription('');
  };

  const startEdit = (taskId: string, taskTitle: string, taskDescription: string) => {
    setEditingTaskId(taskId);
    setEditingTitle(taskTitle);
    setEditingDescription(taskDescription);
  };

  const saveEdit = () => {
    if (!editingTaskId || !editingTitle.trim()) return;
    const updated = editPersonalTask(editingTaskId, editingTitle.trim(), editingDescription.trim());
    if (updated) {
      setEditingTaskId(null);
      setEditingTitle('');
      setEditingDescription('');
    }
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle('');
    setEditingDescription('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1 space-y-8">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Personal Todo</h1>
            <p className="text-gray-600">Track your private tasks and assigned project work in one place.</p>
          </div>

          <Card className="p-4 space-y-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a personal task title"
            />
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              rows={3}
            />
            <Button onClick={handleCreatePersonalTask}>Add Personal Task</Button>
          </Card>

          {sortedPersonalTasks.length === 0 ? (
            <Card className="p-6 text-center text-gray-600">No personal tasks yet.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedPersonalTasks.map(task => (
                <Card key={task.id} className={`p-4 ${task.completed ? 'bg-green-50 border-green-100' : ''}`}>
                  {editingTaskId === task.id ? (
                    <div className="space-y-3">
                      <Input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
                      <Textarea
                        value={editingDescription}
                        onChange={(event) => setEditingDescription(event.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          <Save size={14} className="mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X size={14} className="mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                        <Badge variant="outline" className={task.completed ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                          {task.completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                      {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                      <p className="text-xs text-gray-500">
                        Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                      </p>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => togglePersonalTask(task.id)}>
                          <Check size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() => startEdit(task.id, task.title, task.description)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deletePersonalTask(task.id)}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Assigned From Projects</h2>
            <Badge variant="outline">{assignedProjectTasks.length}</Badge>
          </div>
          {assignedProjectTasks.length === 0 ? (
            <Card className="p-6 text-center text-gray-600">No project tasks are currently assigned to you.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedProjectTasks.map(({ projectId, projectName, task }) => (
                <Card key={`${projectId}-${task.id}`} className={`p-4 ${task.completed ? 'bg-green-50 border-green-100' : ''}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                      <Badge variant="outline" className={task.completed ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <p className="text-xs text-gray-500">Project: {projectName}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{task.priority} priority</Badge>
                      {task.dueDate && (
                        <Badge variant="outline">
                          Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={task.completed}
                        onClick={() => completeAssignedTask(projectId, task.id)}
                      >
                        <Check size={14} className="mr-1" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="py-6 bg-white border-t text-center text-gray-500 text-sm">
        TaskSync &copy; {new Date().getFullYear()} - All rights reserved.
      </footer>
    </div>
  );
};

export default PersonalTodo;
