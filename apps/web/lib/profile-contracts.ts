export type ProfileResponse = {
  profile_id: string;
  display_name?: string | null;
  preferred_language: string;
  diagnosis_selection: {
    diagnosis_code: string;
    diagnosis_source: string;
    free_text_condition?: string | null;
  };
  physical_symptoms: string[];
  emotional_context: string[];
  treatment_history: {
    ablation_count: number;
    has_implantable_device?: boolean | null;
    current_medications: string[];
    prior_procedures: string[];
  };
  personal_narrative?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};
