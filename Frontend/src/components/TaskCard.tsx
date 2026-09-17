
import React from 'react';
import { Check, Trash, Calendar, User, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjects, Task } from '@/contexts/ProjectContext';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit?: (task: Task) => void;
  isAdmin?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, projectId, onEdit, isAdmin = false }) => {
  const { completeTask, deleteTask } = useProjects();

  const handleComplete = () => {
    completeTask(projectId, task.id);
  };

  const handleDelete = () => {
    deleteTask(projectId, task.id);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  // Get priority badge color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Get assigned user name
  const getAssignedUserName = () => {
    if (!task.assignedTo) return null;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const assignedUser = users.find((u: any) => u.id === task.assignedTo);
    return assignedUser ? assignedUser.name : 'Unknown User';
  };

  const assignedUserName = getAssignedUserName();
  
  // Safely capitalize priority, ensuring it exists
  const capitalizedPriority = task.priority 
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) 
    : 'Medium'; // Default to Medium if priority is undefined

  return (
    <Card className={`p-4 ${task.completed ? 'bg-green-50 border-green-100' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            {task.completed && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Completed
              </Badge>
            )}
            <Badge variant="outline" className={getPriorityColor()}>
              {capitalizedPriority} Priority
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{task.description}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {task.dueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar size={14} className="mr-1" />
                Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
              </div>
            )}
            
            {assignedUserName && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                      <User size={14} className="mr-1" />
                      <span className="truncate max-w-[150px]">{assignedUserName}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assigned to: {assignedUserName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && !task.completed && (
            <Button size="icon" variant="outline" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={handleEdit}>
              <Edit size={16} />
            </Button>
          )}
          {!task.completed && (
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleComplete}>
              <Check size={16} />
            </Button>
          )}
          <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={handleDelete}>
            <Trash size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
