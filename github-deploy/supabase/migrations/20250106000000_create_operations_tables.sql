-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_progetto VARCHAR(255) NOT NULL,
  descrizione TEXT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stato VARCHAR(50) NOT NULL CHECK (stato IN ('pianificazione', 'in_corso', 'completato', 'sospeso', 'annullato')),
  priorita VARCHAR(50) NOT NULL CHECK (priorita IN ('bassa', 'media', 'alta', 'critica')),
  data_inizio DATE NOT NULL,
  data_fine_prevista DATE NOT NULL,
  data_fine_effettiva DATE,
  budget_stimato DECIMAL(10,2),
  budget_utilizzato DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  ruolo_principale VARCHAR(50) NOT NULL CHECK (ruolo_principale IN ('project_manager', 'developer', 'designer', 'analyst', 'consultant', 'grafico', 'amazon_specialist', 'linkedin_specialist', 'advertiser', 'altro')),
  tipo_compenso VARCHAR(20) NOT NULL CHECK (tipo_compenso IN ('gettone', 'fisso')),
  compenso_per_gettone DECIMAL(8,2),
  compenso_fisso DECIMAL(10,2),
  gettoni_disponibili INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, user_id)
);

-- Create project_collaborators junction table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  ruolo_progetto VARCHAR(50) NOT NULL CHECK (ruolo_progetto IN ('project_manager', 'developer', 'designer', 'analyst', 'consultant', 'grafico', 'amazon_specialist', 'linkedin_specialist', 'advertiser', 'altro')),
  gettoni_assegnati INTEGER NOT NULL DEFAULT 0,
  gettoni_utilizzati INTEGER NOT NULL DEFAULT 0,
  data_assegnazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  UNIQUE(project_id, collaborator_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_stato ON projects(stato);
CREATE INDEX IF NOT EXISTS idx_projects_priorita ON projects(priorita);
CREATE INDEX IF NOT EXISTS idx_projects_data_inizio ON projects(data_inizio);
CREATE INDEX IF NOT EXISTS idx_projects_data_fine_prevista ON projects(data_fine_prevista);

CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);
CREATE INDEX IF NOT EXISTS idx_collaborators_ruolo_principale ON collaborators(ruolo_principale);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_collaborator_id ON project_collaborators(collaborator_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for collaborators
CREATE POLICY "Users can view their own collaborators" ON collaborators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collaborators" ON collaborators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collaborators" ON collaborators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collaborators" ON collaborators
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for project_collaborators
CREATE POLICY "Users can view project collaborators for their projects" ON project_collaborators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_collaborators.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert project collaborators for their projects" ON project_collaborators
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_collaborators.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update project collaborators for their projects" ON project_collaborators
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_collaborators.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete project collaborators for their projects" ON project_collaborators
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_collaborators.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON collaborators TO authenticated;
GRANT ALL ON project_collaborators TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;