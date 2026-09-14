CREATE OR REPLACE FUNCTION public.log_task_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_account_id UUID;
    v_workspace_id UUID;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get account mapping
        SELECT account_id, workspace_id INTO v_account_id, v_workspace_id 
        FROM public.opportunities WHERE id = NEW.opportunity_id;
        
        INSERT INTO public.activities (
            workspace_id, opportunity_id, account_id, activity_type, 
            title, activity_timestamp, description
        ) VALUES (
            COALESCE(v_workspace_id, NEW.workspace_id), NEW.opportunity_id, v_account_id, 'system', 
            'Task Completed', NOW(), 'Completed Task: ' || NEW.title
        );
        
        -- Also advance the intelligence status
        UPDATE public.opportunity_intelligence
        SET execution_status = 'On Track'
        WHERE opportunity_id = NEW.opportunity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
