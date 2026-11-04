
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "appeal_decisions": {
                  Row: {
                    "appeal_id": string,"choice": Database["public"]['Enums']["appeal_choice"],"decided_at": string,"id": string,"panelist_pseudonym": string
                  }
                  ComputedFields: never
                  Insert: {
                    "appeal_id": string,"choice": Database["public"]['Enums']["appeal_choice"],"decided_at"?: string,"id"?: string,"panelist_pseudonym": string
                  }
                  Update: {
                    "appeal_id"?: string,"choice"?: Database["public"]['Enums']["appeal_choice"],"decided_at"?: string,"id"?: string,"panelist_pseudonym"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appeal_decisions_appeal_id_fkey"
      columns: ["appeal_id"]
isOneToOne: false
      referencedRelation: "appeals"
      referencedColumns: ["id"]
    }
                  ]
                },"appeals": {
                  Row: {
                    "action_id": string,"appellant_id": string,"appellant_label": string,"created_at": string,"decided_at": string | null,"id": string,"outcome": Database["public"]['Enums']["appeal_choice"] | null,"outcome_reason": string | null,"state": Database["public"]['Enums']["appeal_state"],"statement": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action_id": string,"appellant_id": string,"appellant_label": string,"created_at"?: string,"decided_at"?: string | null,"id"?: string,"outcome"?: Database["public"]['Enums']["appeal_choice"] | null,"outcome_reason"?: string | null,"state"?: Database["public"]['Enums']["appeal_state"],"statement": string
                  }
                  Update: {
                    "action_id"?: string,"appellant_id"?: string,"appellant_label"?: string,"created_at"?: string,"decided_at"?: string | null,"id"?: string,"outcome"?: Database["public"]['Enums']["appeal_choice"] | null,"outcome_reason"?: string | null,"state"?: Database["public"]['Enums']["appeal_state"],"statement"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appeals_action_id_fkey"
      columns: ["action_id"]
isOneToOne: false
      referencedRelation: "moderation_actions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appeals_appellant_id_fkey"
      columns: ["appellant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"moderation_state": Database["public"]['Enums']["content_moderation_state"],"parent_comment_id": string | null,"post_id": string,"removed_at": string | null,"removed_under": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"moderation_state"?: Database["public"]['Enums']["content_moderation_state"],"parent_comment_id"?: string | null,"post_id": string,"removed_at"?: string | null,"removed_under"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"moderation_state"?: Database["public"]['Enums']["content_moderation_state"],"parent_comment_id"?: string | null,"post_id"?: string,"removed_at"?: string | null,"removed_under"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_parent_comment_id_fkey"
      columns: ["parent_comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_removed_under_fkey"
      columns: ["removed_under"]
isOneToOne: false
      referencedRelation: "floor_items"
      referencedColumns: ["id"]
    }
                  ]
                },"communities": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_caregiver": boolean,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_caregiver"?: boolean,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_caregiver"?: boolean,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"consent_records": {
                  Row: {
                    "granted_at": string,"id": string,"member_id": string,"policy_version": string,"purpose": Database["public"]['Enums']["consent_purpose"],"source": string,"withdrawn_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"id"?: string,"member_id": string,"policy_version": string,"purpose": Database["public"]['Enums']["consent_purpose"],"source": string,"withdrawn_at"?: string | null
                  }
                  Update: {
                    "granted_at"?: string,"id"?: string,"member_id"?: string,"policy_version"?: string,"purpose"?: Database["public"]['Enums']["consent_purpose"],"source"?: string,"withdrawn_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consent_records_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"floor_items": {
                  Row: {
                    "floor": Database["public"]['Enums']["floor_name"],"id": string,"item_number": number,"text": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "floor": Database["public"]['Enums']["floor_name"],"id"?: string,"item_number": number,"text": string,"version": number
                  }
                  Update: {
                    "floor"?: Database["public"]['Enums']["floor_name"],"id"?: string,"item_number"?: number,"text"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "floor_items_floor_version_fkey"
      columns: ["floor","version"]
isOneToOne: false
      referencedRelation: "floor_versions"
      referencedColumns: ["floor","version"]
    }
                  ]
                },"floor_reexamination_answers": {
                  Row: {
                    "answer": string,"answered_at": string,"floor_item_id": string,"id": string,"question_summary": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"answered_at"?: string,"floor_item_id": string,"id"?: string,"question_summary": string
                  }
                  Update: {
                    "answer"?: string,"answered_at"?: string,"floor_item_id"?: string,"id"?: string,"question_summary"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "floor_reexamination_answers_floor_item_id_fkey"
      columns: ["floor_item_id"]
isOneToOne: false
      referencedRelation: "floor_items"
      referencedColumns: ["id"]
    }
                  ]
                },"floor_reexamination_requests": {
                  Row: {
                    "created_at": string,"floor_item_id": string,"id": string,"request_text": string,"requester_id": string,"state": Database["public"]['Enums']["request_state"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"floor_item_id": string,"id"?: string,"request_text": string,"requester_id": string,"state"?: Database["public"]['Enums']["request_state"]
                  }
                  Update: {
                    "created_at"?: string,"floor_item_id"?: string,"id"?: string,"request_text"?: string,"requester_id"?: string,"state"?: Database["public"]['Enums']["request_state"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "floor_reexamination_requests_floor_item_id_fkey"
      columns: ["floor_item_id"]
isOneToOne: false
      referencedRelation: "floor_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "floor_reexamination_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"floor_versions": {
                  Row: {
                    "adr_ref": string | null,"announced_at": string,"applies_from": string | null,"change_kind": Database["public"]['Enums']["floor_change_kind"],"content_sha256": string,"effective_at": string,"floor": Database["public"]['Enums']["floor_name"],"id": string,"legal_review_ref": string | null,"notice_ends_at": string | null,"policy_version": string | null,"reason": string,"recorded_at": string,"requires_fresh_optin": boolean,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "adr_ref"?: string | null,"announced_at": string,"applies_from"?: string | null,"change_kind": Database["public"]['Enums']["floor_change_kind"],"content_sha256": string,"effective_at": string,"floor": Database["public"]['Enums']["floor_name"],"id"?: string,"legal_review_ref"?: string | null,"notice_ends_at"?: string | null,"policy_version"?: string | null,"reason": string,"recorded_at"?: string,"requires_fresh_optin"?: boolean,"version": number
                  }
                  Update: {
                    "adr_ref"?: string | null,"announced_at"?: string,"applies_from"?: string | null,"change_kind"?: Database["public"]['Enums']["floor_change_kind"],"content_sha256"?: string,"effective_at"?: string,"floor"?: Database["public"]['Enums']["floor_name"],"id"?: string,"legal_review_ref"?: string | null,"notice_ends_at"?: string | null,"policy_version"?: string | null,"reason"?: string,"recorded_at"?: string,"requires_fresh_optin"?: boolean,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"governance_config": {
                  Row: {
                    "int_value": number | null,"key": string,"value": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "int_value"?: number | null,"key": string,"value"?: string | null
                  }
                  Update: {
                    "int_value"?: number | null,"key"?: string,"value"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"health_self_ids": {
                  Row: {
                    "created_at": string,"id": string,"member_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"member_id": string,"tag_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"member_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "health_self_ids_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "health_self_ids_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "self_id_tags"
      referencedColumns: ["id"]
    }
                  ]
                },"journey_entries": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"is_published": boolean,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journey_entries_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"launch_gate_history": {
                  Row: {
                    "changed_at": string,"definition": string,"gate_key": string,"id": string,"new_status": Database["public"]['Enums']["gate_status"],"old_status": Database["public"]['Enums']["gate_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"definition": string,"gate_key": string,"id"?: string,"new_status": Database["public"]['Enums']["gate_status"],"old_status": Database["public"]['Enums']["gate_status"]
                  }
                  Update: {
                    "changed_at"?: string,"definition"?: string,"gate_key"?: string,"id"?: string,"new_status"?: Database["public"]['Enums']["gate_status"],"old_status"?: Database["public"]['Enums']["gate_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "launch_gate_history_gate_key_fkey"
      columns: ["gate_key"]
isOneToOne: false
      referencedRelation: "launch_gates"
      referencedColumns: ["key"]
    }
                  ]
                },"launch_gates": {
                  Row: {
                    "defined_at": string | null,"definition": string,"key": string,"met_at": string | null,"status": Database["public"]['Enums']["gate_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "defined_at"?: string | null,"definition"?: string,"key": string,"met_at"?: string | null,"status"?: Database["public"]['Enums']["gate_status"],"title": string
                  }
                  Update: {
                    "defined_at"?: string | null,"definition"?: string,"key"?: string,"met_at"?: string | null,"status"?: Database["public"]['Enums']["gate_status"],"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"legal_holds": {
                  Row: {
                    "created_at": string,"expires_at": string,"held_id": string,"held_table": string,"id": string,"legal_basis": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at": string,"held_id": string,"held_table": string,"id"?: string,"legal_basis": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"held_id"?: string,"held_table"?: string,"id"?: string,"legal_basis"?: string
                  }
                  Relationships: [
                    
                  ]
                },"member_bans": {
                  Row: {
                    "action_id": string | null,"confirmed_at": string | null,"confirmed_by_pseudonym": string | null,"created_at": string,"ends_at": string,"floor_item_id": string,"id": string,"member_id": string,"proposed_by_pseudonym": string,"reason": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action_id"?: string | null,"confirmed_at"?: string | null,"confirmed_by_pseudonym"?: string | null,"created_at"?: string,"ends_at": string,"floor_item_id": string,"id"?: string,"member_id": string,"proposed_by_pseudonym": string,"reason": string
                  }
                  Update: {
                    "action_id"?: string | null,"confirmed_at"?: string | null,"confirmed_by_pseudonym"?: string | null,"created_at"?: string,"ends_at"?: string,"floor_item_id"?: string,"id"?: string,"member_id"?: string,"proposed_by_pseudonym"?: string,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_bans_action_id_fkey"
      columns: ["action_id"]
isOneToOne: false
      referencedRelation: "moderation_actions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_bans_floor_item_id_fkey"
      columns: ["floor_item_id"]
isOneToOne: false
      referencedRelation: "floor_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_bans_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"member_blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "community_id": string,"id": string,"joined_at": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id": string,"id"?: string,"joined_at"?: string,"member_id": string
                  }
                  Update: {
                    "community_id"?: string,"id"?: string,"joined_at"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_actions": {
                  Row: {
                    "action": Database["public"]['Enums']["moderation_action_kind"],"actor_pseudonym": string,"confirmed_by_pseudonym": string | null,"created_at": string,"ends_at": string | null,"floor_item_id": string | null,"id": string,"item_id": string,"reason": string,"tier1_rule": Database["public"]['Enums']["tier1_rule"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": Database["public"]['Enums']["moderation_action_kind"],"actor_pseudonym": string,"confirmed_by_pseudonym"?: string | null,"created_at"?: string,"ends_at"?: string | null,"floor_item_id"?: string | null,"id"?: string,"item_id": string,"reason": string,"tier1_rule"?: Database["public"]['Enums']["tier1_rule"] | null
                  }
                  Update: {
                    "action"?: Database["public"]['Enums']["moderation_action_kind"],"actor_pseudonym"?: string,"confirmed_by_pseudonym"?: string | null,"created_at"?: string,"ends_at"?: string | null,"floor_item_id"?: string | null,"id"?: string,"item_id"?: string,"reason"?: string,"tier1_rule"?: Database["public"]['Enums']["tier1_rule"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_actions_floor_item_id_fkey"
      columns: ["floor_item_id"]
isOneToOne: false
      referencedRelation: "floor_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_actions_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "moderation_items"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_audit": {
                  Row: {
                    "actor_role": string,"at": string,"function_name": string,"id": string,"row_count": number,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_role": string,"at"?: string,"function_name": string,"id"?: string,"row_count": number,"table_name": string
                  }
                  Update: {
                    "actor_role"?: string,"at"?: string,"function_name"?: string,"id"?: string,"row_count"?: number,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"moderation_items": {
                  Row: {
                    "category": Database["public"]['Enums']["moderation_category"],"closed_at": string | null,"comment_id": string | null,"created_at": string,"first_reviewed_at": string | null,"id": string,"post_id": string | null,"report_count": number,"source": Database["public"]['Enums']["moderation_source"],"state": Database["public"]['Enums']["moderation_item_state"],"tier": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["moderation_category"],"closed_at"?: string | null,"comment_id"?: string | null,"created_at"?: string,"first_reviewed_at"?: string | null,"id"?: string,"post_id"?: string | null,"report_count"?: number,"source": Database["public"]['Enums']["moderation_source"],"state"?: Database["public"]['Enums']["moderation_item_state"],"tier": number
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["moderation_category"],"closed_at"?: string | null,"comment_id"?: string | null,"created_at"?: string,"first_reviewed_at"?: string | null,"id"?: string,"post_id"?: string | null,"report_count"?: number,"source"?: Database["public"]['Enums']["moderation_source"],"state"?: Database["public"]['Enums']["moderation_item_state"],"tier"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_items_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_items_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_log_public": {
                  Row: {
                    "action": string | null,"category": Database["public"]['Enums']["moderation_category"] | null,"count": number | null,"fewer_than_five": boolean,"id": string,"kind": Database["public"]['Enums']["moderation_log_kind"],"scope": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action"?: string | null,"category"?: Database["public"]['Enums']["moderation_category"] | null,"count"?: number | null,"fewer_than_five": boolean,"id"?: string,"kind": Database["public"]['Enums']["moderation_log_kind"],"scope": string,"week_start": string
                  }
                  Update: {
                    "action"?: string | null,"category"?: Database["public"]['Enums']["moderation_category"] | null,"count"?: number | null,"fewer_than_five"?: boolean,"id"?: string,"kind"?: Database["public"]['Enums']["moderation_log_kind"],"scope"?: string,"week_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"moderator_grants": {
                  Row: {
                    "basis": Database["public"]['Enums']["grant_basis"],"election_ref": string | null,"expires_at": string,"granted_at": string,"id": string,"member_id": string,"public_name": string | null,"revoked_at": string | null,"role": Database["public"]['Enums']["moderation_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "basis": Database["public"]['Enums']["grant_basis"],"election_ref"?: string | null,"expires_at": string,"granted_at"?: string,"id"?: string,"member_id": string,"public_name"?: string | null,"revoked_at"?: string | null,"role": Database["public"]['Enums']["moderation_role"]
                  }
                  Update: {
                    "basis"?: Database["public"]['Enums']["grant_basis"],"election_ref"?: string | null,"expires_at"?: string,"granted_at"?: string,"id"?: string,"member_id"?: string,"public_name"?: string | null,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["moderation_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderator_grants_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderator_pseudonyms": {
                  Row: {
                    "created_at": string,"member_id": string,"pseudonym": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"member_id": string,"pseudonym": string
                  }
                  Update: {
                    "created_at"?: string,"member_id"?: string,"pseudonym"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderator_pseudonyms_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"body": string,"community_id": string,"created_at": string,"id": string,"moderation_state": Database["public"]['Enums']["content_moderation_state"],"removed_at": string | null,"removed_under": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"community_id": string,"created_at"?: string,"id"?: string,"moderation_state"?: Database["public"]['Enums']["content_moderation_state"],"removed_at"?: string | null,"removed_under"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"community_id"?: string,"created_at"?: string,"id"?: string,"moderation_state"?: Database["public"]['Enums']["content_moderation_state"],"removed_at"?: string | null,"removed_under"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_removed_under_fkey"
      columns: ["removed_under"]
isOneToOne: false
      referencedRelation: "floor_items"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"role": Database["public"]['Enums']["user_role"],"self_declared": Database["public"]['Enums']["onboarding_choice"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"role"?: Database["public"]['Enums']["user_role"],"self_declared"?: Database["public"]['Enums']["onboarding_choice"] | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["user_role"],"self_declared"?: Database["public"]['Enums']["onboarding_choice"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"removed_content": {
                  Row: {
                    "author_id": string,"body": string,"comment_id": string | null,"id": string,"kind": Database["public"]['Enums']["removed_content_kind"],"post_id": string | null,"removed_at": string,"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"comment_id"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["removed_content_kind"],"post_id"?: string | null,"removed_at"?: string,"title"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"comment_id"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["removed_content_kind"],"post_id"?: string | null,"removed_at"?: string,"title"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "removed_content_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "removed_content_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: true
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "removed_content_post_id_fkey"
      columns: ["post_id"]
isOneToOne: true
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "comment_id": string | null,"created_at": string,"id": string,"item_id": string,"note": string | null,"post_id": string | null,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"item_id": string,"note"?: string | null,"post_id"?: string | null,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string
                  }
                  Update: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"item_id"?: string,"note"?: string | null,"post_id"?: string | null,"reason"?: Database["public"]['Enums']["report_reason"],"reporter_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "moderation_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"second_look_requests": {
                  Row: {
                    "action_id": string,"created_at": string,"id": string,"requester_id": string,"state": Database["public"]['Enums']["request_state"],"statement": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action_id": string,"created_at"?: string,"id"?: string,"requester_id": string,"state"?: Database["public"]['Enums']["request_state"],"statement": string
                  }
                  Update: {
                    "action_id"?: string,"created_at"?: string,"id"?: string,"requester_id"?: string,"state"?: Database["public"]['Enums']["request_state"],"statement"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "second_look_requests_action_id_fkey"
      columns: ["action_id"]
isOneToOne: false
      referencedRelation: "moderation_actions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "second_look_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"self_id_tags": {
                  Row: {
                    "code": string,"created_at": string,"id": string,"is_active": boolean,"label": string,"tag_type": Database["public"]['Enums']["self_id_tag_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"label": string,"tag_type": Database["public"]['Enums']["self_id_tag_type"]
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"label"?: string,"tag_type"?: Database["public"]['Enums']["self_id_tag_type"]
                  }
                  Relationships: [
                    
                  ]
                },"triage_lists": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"list": Database["public"]['Enums']["triage_list_name"],"term": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"list": Database["public"]['Enums']["triage_list_name"],"term": string,"version": number
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"list"?: Database["public"]['Enums']["triage_list_name"],"term"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"upbeats": {
                  Row: {
                    "comment_id": string | null,"created_at": string,"id": string,"journey_entry_id": string | null,"member_id": string,"post_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"journey_entry_id"?: string | null,"member_id": string,"post_id"?: string | null
                  }
                  Update: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"journey_entry_id"?: string | null,"member_id"?: string,"post_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "upbeats_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "upbeats_journey_entry_id_fkey"
      columns: ["journey_entry_id"]
isOneToOne: false
      referencedRelation: "journey_entries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "upbeats_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "upbeats_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"updates_signup_throttle": {
                  Row: {
                    "attempts": number,"email_hash": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"email_hash": string,"window_start": string
                  }
                  Update: {
                    "attempts"?: number,"email_hash"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"updates_subscribers": {
                  Row: {
                    "confirm_token": string,"confirmed_at": string | null,"created_at": string,"email": string,"id": string,"source": string,"unsubscribe_token": string,"unsubscribed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "confirm_token": string,"confirmed_at"?: string | null,"created_at"?: string,"email": string,"id"?: string,"source"?: string,"unsubscribe_token": string,"unsubscribed_at"?: string | null
                  }
                  Update: {
                    "confirm_token"?: string,"confirmed_at"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"source"?: string,"unsubscribe_token"?: string,"unsubscribed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "caller_pseudonym":
{ Args: { "p_function": string }; Returns: string
                           },
"config_interval":
{ Args: { "p_key": string }; Returns: string
                           },
"confirm_action":
{ Args: { "p_action": string }; Returns: undefined
                           },
"confirm_updates_subscription":
{ Args: { "p_token": string }; Returns: string
                           },
"current_grant_is_interim":
{ Args: { "p_role": Database["public"]['Enums']["moderation_role"] }; Returns: boolean
                           },
"decide_appeal":
{ Args: { "p_appeal": string,"p_choice": Database["public"]['Enums']["appeal_choice"] }; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"export_my_moderation_records":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"gate_is_met":
{ Args: { "p_key": string }; Returns: boolean
                           },
"grant_moderator":
{ Args: { "p_basis": Database["public"]['Enums']["grant_basis"],"p_expires_at": string,"p_member": string,"p_public_name"?: string,"p_role": Database["public"]['Enums']["moderation_role"] }; Returns: string
                           },
"has_current_consent":
{ Args: { "p_member": string,"p_purpose": Database["public"]['Enums']["consent_purpose"] }; Returns: boolean
                           },
"has_current_grant":
{ Args: { "p_role": Database["public"]['Enums']["moderation_role"] }; Returns: boolean
                           },
"has_current_health_consent":
{ Args: { "p_member": string }; Returns: boolean
                           },
"interim_moderators_public":
{ Args: Record<PropertyKey, never>; Returns: {
              "expires_at": string,"granted_at": string,"public_name": string,"role": Database["public"]['Enums']["moderation_role"]
            }[]
                           },
"is_banned_now":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_moderator":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"item_author":
{ Args: { "p_item": string }; Returns: string
                           },
"member_reported_item_subject":
{ Args: { "p_item": string,"p_member": string }; Returns: boolean
                           },
"moderate":
{ Args: { "p_action": Database["public"]['Enums']["moderation_action_kind"],"p_ends_at": string,"p_floor_item": string,"p_item": string,"p_reason": string,"p_tier1_rule": Database["public"]['Enums']["tier1_rule"] }; Returns: string
                           },
"moderation_audit_write":
{ Args: { "p_function": string,"p_role": string,"p_rows": number,"p_table": string }; Returns: undefined
                           },
"moderation_queue":
{ Args: Record<PropertyKey, never>; Returns: {
              "age_hours": number,"category": Database["public"]['Enums']["moderation_category"],"comment_id": string,"item_id": string,"post_id": string,"reported": boolean,"state": Database["public"]['Enums']["moderation_item_state"],"tier": number
            }[]
                           },
"move_text_back":
{ Args: { "p_comment": string,"p_post": string }; Returns: undefined
                           },
"move_text_out":
{ Args: { "p_comment": string,"p_floor_item": string,"p_kind": Database["public"]['Enums']["removed_content_kind"],"p_post": string,"p_state": Database["public"]['Enums']["content_moderation_state"] }; Returns: undefined
                           },
"my_moderation_notices":
{ Args: Record<PropertyKey, never>; Returns: {
              "action": Database["public"]['Enums']["moderation_action_kind"],"action_id": string,"comment_id": string,"created_at": string,"ends_at": string,"floor": Database["public"]['Enums']["floor_name"],"floor_item_number": number,"floor_item_text": string,"floor_version": number,"post_id": string,"reason": string,"tier1_rule": Database["public"]['Enums']["tier1_rule"]
            }[]
                           },
"purge_unconfirmed_updates_subscribers":
{ Args: { "p_older_than"?: string }; Returns: number
                           },
"report_content":
{ Args: { "p_comment": string,"p_note": string,"p_post": string,"p_reason": Database["public"]['Enums']["report_reason"] }; Returns: string
                           },
"request_second_look":
{ Args: { "p_action": string,"p_statement": string }; Returns: string
                           },
"submit_appeal":
{ Args: { "p_action": string,"p_statement": string }; Returns: string
                           },
"subscribe_to_updates":
{ Args: { "p_email": string,"p_source"?: string }; Returns: undefined
                           },
"unsubscribe_from_updates":
{ Args: { "p_token": string }; Returns: string
                           },
"withdraw_appeal":
{ Args: { "p_appeal": string }; Returns: undefined
                           }
          }
          Enums: {
            "appeal_choice": "uphold"|"overturn","appeal_state": "submitted"|"waiting_for_panel"|"decided"|"withdrawn","consent_purpose": "health_self_id"|"moderator_public_name"|"reexam_show_name","content_moderation_state": "visible"|"removed"|"locked","floor_change_kind": "initial"|"tighten"|"tighten_emergency"|"loosen","floor_name": "safety"|"privacy","gate_status": "unmet"|"met","grant_basis": "interim"|"elected","moderation_action_kind": "remove"|"restore"|"context_note"|"lock"|"no_action"|"escalate"|"temporary_ban"|"sent_crisis_resources"|"request_edit","moderation_category": "crisis"|"dangerous_misinfo"|"harassment"|"doxxing"|"illegal"|"impersonation"|"spam"|"scam"|"other_safety"|"tier1","moderation_item_state": "queued"|"checking"|"in_review"|"escalated"|"actioned"|"appealed"|"closed","moderation_log_kind": "action"|"appeal_outcome"|"legal_hold"|"grant_count"|"floor_change"|"gate_change","moderation_role": "moderator"|"panelist","moderation_source": "report"|"triage","onboarding_choice": "patient"|"caregiver"|"both"|"professional","removed_content_kind": "removed"|"held","report_reason": "self_harm"|"dangerous_misinfo"|"harassment"|"spam_or_scam"|"other_safety"|"off_topic"|"unkind","request_state": "submitted"|"answered"|"withdrawn","self_id_tag_type": "diagnosis"|"physical_symptom"|"emotional_symptom","tier1_rule": "off_topic"|"unkind","triage_list_name": "crisis"|"misinfo"|"spam"|"scam","user_role": "patient"|"caregiver"|"professional"|"moderator"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "appeal_choice": ["uphold", "overturn"],"appeal_state": ["submitted", "waiting_for_panel", "decided", "withdrawn"],"consent_purpose": ["health_self_id", "moderator_public_name", "reexam_show_name"],"content_moderation_state": ["visible", "removed", "locked"],"floor_change_kind": ["initial", "tighten", "tighten_emergency", "loosen"],"floor_name": ["safety", "privacy"],"gate_status": ["unmet", "met"],"grant_basis": ["interim", "elected"],"moderation_action_kind": ["remove", "restore", "context_note", "lock", "no_action", "escalate", "temporary_ban", "sent_crisis_resources", "request_edit"],"moderation_category": ["crisis", "dangerous_misinfo", "harassment", "doxxing", "illegal", "impersonation", "spam", "scam", "other_safety", "tier1"],"moderation_item_state": ["queued", "checking", "in_review", "escalated", "actioned", "appealed", "closed"],"moderation_log_kind": ["action", "appeal_outcome", "legal_hold", "grant_count", "floor_change", "gate_change"],"moderation_role": ["moderator", "panelist"],"moderation_source": ["report", "triage"],"onboarding_choice": ["patient", "caregiver", "both", "professional"],"removed_content_kind": ["removed", "held"],"report_reason": ["self_harm", "dangerous_misinfo", "harassment", "spam_or_scam", "other_safety", "off_topic", "unkind"],"request_state": ["submitted", "answered", "withdrawn"],"self_id_tag_type": ["diagnosis", "physical_symptom", "emotional_symptom"],"tier1_rule": ["off_topic", "unkind"],"triage_list_name": ["crisis", "misinfo", "spam", "scam"],"user_role": ["patient", "caregiver", "professional", "moderator", "admin"]
          }
        }
} as const
