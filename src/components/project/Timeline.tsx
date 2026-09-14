import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TimelineProps {
  projectId: string;
  phases: any[];
  tasks: any[];
  isAdminOrClient: boolean;
  isVendor: boolean;
}

const Timeline = ({ projectId, phases, tasks, isAdminOrClient, isVendor }: TimelineProps) => {
  const [activePhase, setActivePhase] = useState<string | null>(phases?.[0]?.id || null);
  const [addingPhase, setAddingPhase] = useState(false);
  const [addingTask, setAddingTask] = useState<string | null>(null);
  
  const [newPhaseTitle, setNewPhaseTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const sortedPhases = [...(phases || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const handleAddPhase = async () => {
    if (!newPhaseTitle.trim()) return;
    const title = newPhaseTitle;
    const orderIndex = sortedPhases.length;
    
    // Optimistic UI updates
    setAddingPhase(false);
    setNewPhaseTitle("");
    
    queryClient.setQueryData(["project", projectId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        phases: [...(oldData.phases || []), { id: `temp-${Date.now()}`, project_id: projectId, title, order_index: orderIndex, status: 'pending' }]
      };
    });

    const { error } = await supabase.from('project_phases').insert({
      project_id: projectId,
      title: title,
      order_index: orderIndex,
      status: 'pending'
    });
    
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const handleAddTask = async (phaseId: string) => {
    if (!newTaskTitle.trim()) return;
    const title = newTaskTitle;
    
    // Optimistic UI updates
    setAddingTask(null);
    setNewTaskTitle("");
    
    queryClient.setQueryData(["project", projectId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        tasks: [...(oldData.tasks || []), { id: `temp-${Date.now()}`, phase_id: phaseId, title, is_completed: false }]
      };
    });

    const { error } = await supabase.from('project_tasks').insert({
      phase_id: phaseId,
      title: title,
      is_completed: false
    });
    
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    // Optimistic UI update
    queryClient.setQueryData(["project", projectId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        tasks: oldData.tasks.map((t: any) => t.id === taskId ? { ...t, is_completed: !currentStatus } : t)
      };
    });

    const { error } = await supabase.from('project_tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
    if (error) {
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Timeline UI */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex min-w-max gap-4 items-center px-1">
          {sortedPhases.map((phase, index) => {
            const isActive = activePhase === phase.id;
            const phaseTasks = tasks?.filter(t => t.phase_id === phase.id) || [];
            const completedTasks = phaseTasks.filter(t => t.is_completed).length;
            const isCompleted = phaseTasks.length > 0 && completedTasks === phaseTasks.length;
            
            return (
              <div key={phase.id} className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePhase(phase.id)}
                  className={`relative p-4 rounded-xl cursor-pointer min-w-[200px] border transition-all duration-300 ${
                    isActive ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(56,130,246,0.15)]' : 'bg-card/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <h4 className={`font-semibold text-sm mb-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {index + 1}. {phase.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                    <span>{completedTasks}/{phaseTasks.length} tasks</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isCompleted ? 'border-emerald-500/30 text-emerald-500' : 'border-white/10'}`}>
                      {isCompleted ? 'Done' : phase.status}
                    </Badge>
                  </div>
                  
                  {/* Progress Bar inside phase card */}
                  <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                      initial={{ width: 0 }}
                      animate={{ width: phaseTasks.length > 0 ? `${(completedTasks / phaseTasks.length) * 100}%` : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
                
                {/* Connector Line */}
                {index < sortedPhases.length - 1 && (
                  <div className="w-8 h-px bg-white/10 shrink-0" />
                )}
              </div>
            );
          })}
          
          {(isAdminOrClient || isVendor) && (
            <div className="flex items-center ml-4">
              {addingPhase ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-card/40 border border-white/10 min-w-[250px]">
                  <Input 
                    placeholder="Phase Name" 
                    value={newPhaseTitle} 
                    onChange={e => setNewPhaseTitle(e.target.value)}
                    className="h-8 text-sm bg-white/5 border-0"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddPhase} className="h-8 px-3">
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingPhase(false)} className="h-8 px-2">Cancel</Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="h-14 border-dashed border-white/20 text-muted-foreground hover:text-foreground gap-2 rounded-xl"
                  onClick={() => setAddingPhase(true)}
                >
                  <Plus className="w-4 h-4" /> Add Phase
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Phase Details */}
      <AnimatePresence mode="wait">
        {activePhase && (
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{sortedPhases.find(p => p.id === activePhase)?.title} - Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {tasks?.filter(t => t.phase_id === activePhase).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-white/10 rounded-lg flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-muted-foreground/50" />
                      No tasks defined for this phase yet.
                    </div>
                  ) : (
                    tasks?.filter(t => t.phase_id === activePhase).map(task => (
                      <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${task.is_completed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                        <Checkbox 
                          checked={task.is_completed} 
                          onCheckedChange={() => toggleTaskCompletion(task.id, task.is_completed)}
                          disabled={!isAdminOrClient && !isVendor}
                          className={task.is_completed ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" : ""}
                        />
                        <span className={`text-sm flex-1 ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}

                  {addingTask === activePhase ? (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                      <Input 
                        placeholder="Task description..." 
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)}
                        className="bg-white/5 border-white/10"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddTask(activePhase);
                        }}
                      />
                      <Button onClick={() => handleAddTask(activePhase)}>
                        Add
                      </Button>
                      <Button variant="ghost" onClick={() => setAddingTask(null)}>Cancel</Button>
                    </div>
                  ) : (
                    (isAdminOrClient || isVendor) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-4 text-muted-foreground hover:text-primary gap-2"
                        onClick={() => setAddingTask(activePhase)}
                      >
                        <Plus className="w-4 h-4" /> Add Task
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
