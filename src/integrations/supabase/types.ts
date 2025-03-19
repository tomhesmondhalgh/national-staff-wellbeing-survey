export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_plan_descriptors: {
        Row: {
          assigned_to: string | null
          created_at: string
          deadline: string | null
          descriptor_text: string
          id: string
          index_number: string | null
          key_actions: string | null
          last_updated: string | null
          reference: string
          section: string
          status: Database["public"]["Enums"]["descriptor_status"]
          template_id: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          descriptor_text: string
          id?: string
          index_number?: string | null
          key_actions?: string | null
          last_updated?: string | null
          reference: string
          section: string
          status?: Database["public"]["Enums"]["descriptor_status"]
          template_id?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          descriptor_text?: string
          id?: string
          index_number?: string | null
          key_actions?: string | null
          last_updated?: string | null
          reference?: string
          section?: string
          status?: Database["public"]["Enums"]["descriptor_status"]
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_descriptors_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "action_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_progress_notes: {
        Row: {
          created_at: string
          descriptor_id: string
          id: string
          note_date: string
          note_text: string
        }
        Insert: {
          created_at?: string
          descriptor_id: string
          id?: string
          note_date?: string
          note_text: string
        }
        Update: {
          created_at?: string
          descriptor_id?: string
          id?: string
          note_date?: string
          note_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_progress_notes_descriptor_id_fkey"
            columns: ["descriptor_id"]
            isOneToOne: false
            referencedRelation: "action_plan_descriptors"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_question_responses: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "custom_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_question_responses_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questions: {
        Row: {
          archived: boolean | null
          created_at: string | null
          creator_id: string
          id: string
          options: string[] | null
          text: string
          type: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          creator_id: string
          id?: string
          options?: string[] | null
          text: string
          type: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          creator_id?: string
          id?: string
          options?: string[] | null
          text?: string
          type?: string
        }
        Relationships: []
      }
      custom_scripts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          script_content: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_content: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_content?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          group_id: string | null
          id: string
          invited_by: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          group_id?: string | null
          id?: string
          invited_by: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          group_id?: string | null
          id?: string
          invited_by?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          token?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          billing_address: string | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_postcode: string | null
          billing_school_name: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          invoice_number: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id: string | null
          subscription_id: string
        }
        Insert: {
          amount: number
          billing_address?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_postcode?: string | null
          billing_school_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id?: string | null
          subscription_id: string
        }
        Update: {
          amount?: number
          billing_address?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_postcode?: string | null
          billing_school_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string
          duration_months: number | null
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price: number
          purchase_type: string | null
          sort_order: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description: string
          duration_months?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price?: number
          purchase_type?: string | null
          sort_order: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          duration_months?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price?: number
          purchase_type?: string | null
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          school_address: string | null
          school_name: string | null
          updated_at: string
          xero_access_token: string | null
          xero_auth_state: string | null
          xero_code_verifier: string | null
          xero_connected: boolean | null
          xero_connected_at: string | null
          xero_redirect_uri: string | null
          xero_refresh_token: string | null
          xero_token_expires_at: number | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          school_address?: string | null
          school_name?: string | null
          updated_at?: string
          xero_access_token?: string | null
          xero_auth_state?: string | null
          xero_code_verifier?: string | null
          xero_connected?: boolean | null
          xero_connected_at?: string | null
          xero_redirect_uri?: string | null
          xero_refresh_token?: string | null
          xero_token_expires_at?: number | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          school_address?: string | null
          school_name?: string | null
          updated_at?: string
          xero_access_token?: string | null
          xero_auth_state?: string | null
          xero_code_verifier?: string | null
          xero_connected?: boolean | null
          xero_connected_at?: string | null
          xero_redirect_uri?: string | null
          xero_refresh_token?: string | null
          xero_token_expires_at?: number | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          hierarchy_order: number
          id: string
          level: Database["public"]["Enums"]["role_hierarchy_level"]
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          hierarchy_order: number
          id?: string
          level: Database["public"]["Enums"]["role_hierarchy_level"]
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          hierarchy_order?: number
          id?: string
          level?: Database["public"]["Enums"]["role_hierarchy_level"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          AccreditationExpiryDate: string | null
          Address3: string | null
          "AdministrativeWard (code)": string | null
          "AdministrativeWard (name)": string | null
          "AdmissionsPolicy (code)": string | null
          "AdmissionsPolicy (name)": string | null
          "Boarders (code)": string | null
          "Boarders (name)": string | null
          "BoardingEstablishment (name)": string | null
          "BSOInspectorateName (name)": string | null
          "CCF (name)": string | null
          CensusDate: string | null
          CHNumber: string | null
          CloseDate: string | null
          "Country (name)": string | null
          "County (name)": string | null
          DateOfLastInspectionVisit: string | null
          "Diocese (code)": string | null
          "Diocese (name)": string | null
          "DistrictAdministrative (code)": string | null
          "DistrictAdministrative (name)": string | null
          Easting: string | null
          "EBD (name)": string | null
          "EdByOther (name)": string | null
          "EstablishmentAccredited (code)": string | null
          "EstablishmentAccredited (name)": string | null
          EstablishmentName: string | null
          EstablishmentNumber: number | null
          "EstablishmentStatus (code)": number | null
          "EstablishmentStatus (name)": string | null
          "EstablishmentTypeGroup (code)": number | null
          "EstablishmentTypeGroup (name)": string | null
          "FederationFlag (name)": string | null
          "Federations (code)": string | null
          "Federations (name)": string | null
          FEHEIdentifier: string | null
          FSM: string | null
          "FTProv (name)": string | null
          "FurtherEducationType (name)": string | null
          "Gender (code)": string | null
          "Gender (name)": string | null
          "GOR (code)": string | null
          "GOR (name)": string | null
          "GSSLACode (name)": string | null
          HeadFirstName: string | null
          HeadLastName: string | null
          HeadPreferredJobTitle: string | null
          "HeadTitle (name)": string | null
          "InspectorateName (name)": string | null
          InspectorateReport: string | null
          "LA (code)": string | null
          "LA (name)": string | null
          LastChangedDate: string | null
          Locality: string | null
          "LSOA (code)": string | null
          "LSOA (name)": string | null
          "MSOA (code)": string | null
          "MSOA (name)": string | null
          NextInspectionVisit: string | null
          Northing: string | null
          NumberOfBoys: string | null
          NumberOfGirls: string | null
          NumberOfPupils: string | null
          "NurseryProvision (name)": string | null
          "OfficialSixthForm (code)": string | null
          "OfficialSixthForm (name)": string | null
          OpenDate: string | null
          "ParliamentaryConstituency (code)": string | null
          "ParliamentaryConstituency (name)": string | null
          PercentageFSM: string | null
          "PhaseOfEducation (code)": string | null
          "PhaseOfEducation (name)": string | null
          PlacesPRU: string | null
          Postcode: string | null
          PreviousEstablishmentNumber: string | null
          "PreviousLA (code)": number | null
          "PreviousLA (name)": string | null
          PropsName: string | null
          "QABName (code)": string | null
          "QABName (name)": string | null
          QABReport: string | null
          "ReasonEstablishmentClosed (code)": string | null
          "ReasonEstablishmentClosed (name)": string | null
          "ReasonEstablishmentOpened (code)": string | null
          "ReasonEstablishmentOpened (name)": string | null
          "ReligiousCharacter (code)": string | null
          "ReligiousCharacter (name)": string | null
          "ReligiousEthos (name)": string | null
          ResourcedProvisionCapacity: string | null
          ResourcedProvisionOnRoll: string | null
          SchoolCapacity: string | null
          "SchoolSponsorFlag (name)": string | null
          "SchoolSponsors (name)": string | null
          SchoolWebsite: string | null
          "Section41Approved (name)": string | null
          "SEN1 (name)": string | null
          "SEN10 (name)": string | null
          "SEN11 (name)": string | null
          "SEN12 (name)": string | null
          "SEN13 (name)": string | null
          "SEN2 (name)": string | null
          "SEN3 (name)": string | null
          "SEN4 (name)": string | null
          "SEN5 (name)": string | null
          "SEN6 (name)": string | null
          "SEN7 (name)": string | null
          "SEN8 (name)": string | null
          "SEN9 (name)": string | null
          SENNoStat: string | null
          "SENPRU (name)": string | null
          SENStat: string | null
          SenUnitCapacity: string | null
          SenUnitOnRoll: string | null
          SiteName: string | null
          "SpecialClasses (code)": string | null
          "SpecialClasses (name)": string | null
          StatutoryHighAge: string | null
          StatutoryLowAge: string | null
          Street: string | null
          "TeenMoth (name)": string | null
          TeenMothPlaces: string | null
          TelephoneNum: string | null
          Town: string | null
          "Trusts (code)": string | null
          "Trusts (name)": string | null
          "TrustSchoolFlag (code)": string | null
          "TrustSchoolFlag (name)": string | null
          "TypeOfEstablishment (code)": number | null
          "TypeOfEstablishment (name)": string | null
          "TypeOfResourcedProvision (name)": string | null
          UKPRN: string | null
          UPRN: string | null
          "UrbanRural (code)": string | null
          "UrbanRural (name)": string | null
          URN: number
        }
        Insert: {
          AccreditationExpiryDate?: string | null
          Address3?: string | null
          "AdministrativeWard (code)"?: string | null
          "AdministrativeWard (name)"?: string | null
          "AdmissionsPolicy (code)"?: string | null
          "AdmissionsPolicy (name)"?: string | null
          "Boarders (code)"?: string | null
          "Boarders (name)"?: string | null
          "BoardingEstablishment (name)"?: string | null
          "BSOInspectorateName (name)"?: string | null
          "CCF (name)"?: string | null
          CensusDate?: string | null
          CHNumber?: string | null
          CloseDate?: string | null
          "Country (name)"?: string | null
          "County (name)"?: string | null
          DateOfLastInspectionVisit?: string | null
          "Diocese (code)"?: string | null
          "Diocese (name)"?: string | null
          "DistrictAdministrative (code)"?: string | null
          "DistrictAdministrative (name)"?: string | null
          Easting?: string | null
          "EBD (name)"?: string | null
          "EdByOther (name)"?: string | null
          "EstablishmentAccredited (code)"?: string | null
          "EstablishmentAccredited (name)"?: string | null
          EstablishmentName?: string | null
          EstablishmentNumber?: number | null
          "EstablishmentStatus (code)"?: number | null
          "EstablishmentStatus (name)"?: string | null
          "EstablishmentTypeGroup (code)"?: number | null
          "EstablishmentTypeGroup (name)"?: string | null
          "FederationFlag (name)"?: string | null
          "Federations (code)"?: string | null
          "Federations (name)"?: string | null
          FEHEIdentifier?: string | null
          FSM?: string | null
          "FTProv (name)"?: string | null
          "FurtherEducationType (name)"?: string | null
          "Gender (code)"?: string | null
          "Gender (name)"?: string | null
          "GOR (code)"?: string | null
          "GOR (name)"?: string | null
          "GSSLACode (name)"?: string | null
          HeadFirstName?: string | null
          HeadLastName?: string | null
          HeadPreferredJobTitle?: string | null
          "HeadTitle (name)"?: string | null
          "InspectorateName (name)"?: string | null
          InspectorateReport?: string | null
          "LA (code)"?: string | null
          "LA (name)"?: string | null
          LastChangedDate?: string | null
          Locality?: string | null
          "LSOA (code)"?: string | null
          "LSOA (name)"?: string | null
          "MSOA (code)"?: string | null
          "MSOA (name)"?: string | null
          NextInspectionVisit?: string | null
          Northing?: string | null
          NumberOfBoys?: string | null
          NumberOfGirls?: string | null
          NumberOfPupils?: string | null
          "NurseryProvision (name)"?: string | null
          "OfficialSixthForm (code)"?: string | null
          "OfficialSixthForm (name)"?: string | null
          OpenDate?: string | null
          "ParliamentaryConstituency (code)"?: string | null
          "ParliamentaryConstituency (name)"?: string | null
          PercentageFSM?: string | null
          "PhaseOfEducation (code)"?: string | null
          "PhaseOfEducation (name)"?: string | null
          PlacesPRU?: string | null
          Postcode?: string | null
          PreviousEstablishmentNumber?: string | null
          "PreviousLA (code)"?: number | null
          "PreviousLA (name)"?: string | null
          PropsName?: string | null
          "QABName (code)"?: string | null
          "QABName (name)"?: string | null
          QABReport?: string | null
          "ReasonEstablishmentClosed (code)"?: string | null
          "ReasonEstablishmentClosed (name)"?: string | null
          "ReasonEstablishmentOpened (code)"?: string | null
          "ReasonEstablishmentOpened (name)"?: string | null
          "ReligiousCharacter (code)"?: string | null
          "ReligiousCharacter (name)"?: string | null
          "ReligiousEthos (name)"?: string | null
          ResourcedProvisionCapacity?: string | null
          ResourcedProvisionOnRoll?: string | null
          SchoolCapacity?: string | null
          "SchoolSponsorFlag (name)"?: string | null
          "SchoolSponsors (name)"?: string | null
          SchoolWebsite?: string | null
          "Section41Approved (name)"?: string | null
          "SEN1 (name)"?: string | null
          "SEN10 (name)"?: string | null
          "SEN11 (name)"?: string | null
          "SEN12 (name)"?: string | null
          "SEN13 (name)"?: string | null
          "SEN2 (name)"?: string | null
          "SEN3 (name)"?: string | null
          "SEN4 (name)"?: string | null
          "SEN5 (name)"?: string | null
          "SEN6 (name)"?: string | null
          "SEN7 (name)"?: string | null
          "SEN8 (name)"?: string | null
          "SEN9 (name)"?: string | null
          SENNoStat?: string | null
          "SENPRU (name)"?: string | null
          SENStat?: string | null
          SenUnitCapacity?: string | null
          SenUnitOnRoll?: string | null
          SiteName?: string | null
          "SpecialClasses (code)"?: string | null
          "SpecialClasses (name)"?: string | null
          StatutoryHighAge?: string | null
          StatutoryLowAge?: string | null
          Street?: string | null
          "TeenMoth (name)"?: string | null
          TeenMothPlaces?: string | null
          TelephoneNum?: string | null
          Town?: string | null
          "Trusts (code)"?: string | null
          "Trusts (name)"?: string | null
          "TrustSchoolFlag (code)"?: string | null
          "TrustSchoolFlag (name)"?: string | null
          "TypeOfEstablishment (code)"?: number | null
          "TypeOfEstablishment (name)"?: string | null
          "TypeOfResourcedProvision (name)"?: string | null
          UKPRN?: string | null
          UPRN?: string | null
          "UrbanRural (code)"?: string | null
          "UrbanRural (name)"?: string | null
          URN: number
        }
        Update: {
          AccreditationExpiryDate?: string | null
          Address3?: string | null
          "AdministrativeWard (code)"?: string | null
          "AdministrativeWard (name)"?: string | null
          "AdmissionsPolicy (code)"?: string | null
          "AdmissionsPolicy (name)"?: string | null
          "Boarders (code)"?: string | null
          "Boarders (name)"?: string | null
          "BoardingEstablishment (name)"?: string | null
          "BSOInspectorateName (name)"?: string | null
          "CCF (name)"?: string | null
          CensusDate?: string | null
          CHNumber?: string | null
          CloseDate?: string | null
          "Country (name)"?: string | null
          "County (name)"?: string | null
          DateOfLastInspectionVisit?: string | null
          "Diocese (code)"?: string | null
          "Diocese (name)"?: string | null
          "DistrictAdministrative (code)"?: string | null
          "DistrictAdministrative (name)"?: string | null
          Easting?: string | null
          "EBD (name)"?: string | null
          "EdByOther (name)"?: string | null
          "EstablishmentAccredited (code)"?: string | null
          "EstablishmentAccredited (name)"?: string | null
          EstablishmentName?: string | null
          EstablishmentNumber?: number | null
          "EstablishmentStatus (code)"?: number | null
          "EstablishmentStatus (name)"?: string | null
          "EstablishmentTypeGroup (code)"?: number | null
          "EstablishmentTypeGroup (name)"?: string | null
          "FederationFlag (name)"?: string | null
          "Federations (code)"?: string | null
          "Federations (name)"?: string | null
          FEHEIdentifier?: string | null
          FSM?: string | null
          "FTProv (name)"?: string | null
          "FurtherEducationType (name)"?: string | null
          "Gender (code)"?: string | null
          "Gender (name)"?: string | null
          "GOR (code)"?: string | null
          "GOR (name)"?: string | null
          "GSSLACode (name)"?: string | null
          HeadFirstName?: string | null
          HeadLastName?: string | null
          HeadPreferredJobTitle?: string | null
          "HeadTitle (name)"?: string | null
          "InspectorateName (name)"?: string | null
          InspectorateReport?: string | null
          "LA (code)"?: string | null
          "LA (name)"?: string | null
          LastChangedDate?: string | null
          Locality?: string | null
          "LSOA (code)"?: string | null
          "LSOA (name)"?: string | null
          "MSOA (code)"?: string | null
          "MSOA (name)"?: string | null
          NextInspectionVisit?: string | null
          Northing?: string | null
          NumberOfBoys?: string | null
          NumberOfGirls?: string | null
          NumberOfPupils?: string | null
          "NurseryProvision (name)"?: string | null
          "OfficialSixthForm (code)"?: string | null
          "OfficialSixthForm (name)"?: string | null
          OpenDate?: string | null
          "ParliamentaryConstituency (code)"?: string | null
          "ParliamentaryConstituency (name)"?: string | null
          PercentageFSM?: string | null
          "PhaseOfEducation (code)"?: string | null
          "PhaseOfEducation (name)"?: string | null
          PlacesPRU?: string | null
          Postcode?: string | null
          PreviousEstablishmentNumber?: string | null
          "PreviousLA (code)"?: number | null
          "PreviousLA (name)"?: string | null
          PropsName?: string | null
          "QABName (code)"?: string | null
          "QABName (name)"?: string | null
          QABReport?: string | null
          "ReasonEstablishmentClosed (code)"?: string | null
          "ReasonEstablishmentClosed (name)"?: string | null
          "ReasonEstablishmentOpened (code)"?: string | null
          "ReasonEstablishmentOpened (name)"?: string | null
          "ReligiousCharacter (code)"?: string | null
          "ReligiousCharacter (name)"?: string | null
          "ReligiousEthos (name)"?: string | null
          ResourcedProvisionCapacity?: string | null
          ResourcedProvisionOnRoll?: string | null
          SchoolCapacity?: string | null
          "SchoolSponsorFlag (name)"?: string | null
          "SchoolSponsors (name)"?: string | null
          SchoolWebsite?: string | null
          "Section41Approved (name)"?: string | null
          "SEN1 (name)"?: string | null
          "SEN10 (name)"?: string | null
          "SEN11 (name)"?: string | null
          "SEN12 (name)"?: string | null
          "SEN13 (name)"?: string | null
          "SEN2 (name)"?: string | null
          "SEN3 (name)"?: string | null
          "SEN4 (name)"?: string | null
          "SEN5 (name)"?: string | null
          "SEN6 (name)"?: string | null
          "SEN7 (name)"?: string | null
          "SEN8 (name)"?: string | null
          "SEN9 (name)"?: string | null
          SENNoStat?: string | null
          "SENPRU (name)"?: string | null
          SENStat?: string | null
          SenUnitCapacity?: string | null
          SenUnitOnRoll?: string | null
          SiteName?: string | null
          "SpecialClasses (code)"?: string | null
          "SpecialClasses (name)"?: string | null
          StatutoryHighAge?: string | null
          StatutoryLowAge?: string | null
          Street?: string | null
          "TeenMoth (name)"?: string | null
          TeenMothPlaces?: string | null
          TelephoneNum?: string | null
          Town?: string | null
          "Trusts (code)"?: string | null
          "Trusts (name)"?: string | null
          "TrustSchoolFlag (code)"?: string | null
          "TrustSchoolFlag (name)"?: string | null
          "TypeOfEstablishment (code)"?: number | null
          "TypeOfEstablishment (name)"?: string | null
          "TypeOfResourcedProvision (name)"?: string | null
          UKPRN?: string | null
          UPRN?: string | null
          "UrbanRural (code)"?: string | null
          "UrbanRural (name)"?: string | null
          URN?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_level: string | null
          created_at: string
          end_date: string | null
          id: string
          invoice_number: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan_type: Database["public"]["Enums"]["plan_type"]
          purchase_type: string
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_level?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          invoice_number?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan_type?: Database["public"]["Enums"]["plan_type"]
          purchase_type?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_level?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          invoice_number?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          plan_type?: Database["public"]["Enums"]["plan_type"]
          purchase_type?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          survey_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "custom_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          confidence_in_role: string | null
          created_at: string
          doing_well: string | null
          health_state: string | null
          id: string
          improvements: string | null
          leadership_prioritize: string | null
          leaving_contemplation: string | null
          manageable_workload: string | null
          org_pride: string | null
          recommendation_score: string | null
          role: string | null
          support_access: string | null
          survey_template_id: string | null
          valued_member: string | null
          work_life_balance: string | null
        }
        Insert: {
          confidence_in_role?: string | null
          created_at?: string
          doing_well?: string | null
          health_state?: string | null
          id?: string
          improvements?: string | null
          leadership_prioritize?: string | null
          leaving_contemplation?: string | null
          manageable_workload?: string | null
          org_pride?: string | null
          recommendation_score?: string | null
          role?: string | null
          support_access?: string | null
          survey_template_id?: string | null
          valued_member?: string | null
          work_life_balance?: string | null
        }
        Update: {
          confidence_in_role?: string | null
          created_at?: string
          doing_well?: string | null
          health_state?: string | null
          id?: string
          improvements?: string | null
          leadership_prioritize?: string | null
          leaving_contemplation?: string | null
          manageable_workload?: string | null
          org_pride?: string | null
          recommendation_score?: string | null
          role?: string | null
          support_access?: string | null
          survey_template_id?: string | null
          valued_member?: string | null
          work_life_balance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          close_date: string | null
          created_at: string
          creator_id: string | null
          date: string
          emails: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["survey_status"] | null
          updated_at: string
        }
        Insert: {
          close_date?: string | null
          created_at?: string
          creator_id?: string | null
          date?: string
          emails?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["survey_status"] | null
          updated_at?: string
        }
        Update: {
          close_date?: string | null
          created_at?: string
          creator_id?: string | null
          date?: string
          emails?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["survey_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_contact_mappings: {
        Row: {
          created_at: string
          id: string
          school_name: string
          updated_at: string
          xero_contact_id: string
          xero_contact_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_name: string
          updated_at?: string
          xero_contact_id: string
          xero_contact_name: string
        }
        Update: {
          created_at?: string
          id?: string
          school_name?: string
          updated_at?: string
          xero_contact_id?: string
          xero_contact_name?: string
        }
        Relationships: []
      }
      xero_credentials: {
        Row: {
          access_token: string
          expires_at: string
          id: number
          refresh_token: string
          scope: string | null
          token_type: string
          updated_at: string
        }
        Insert: {
          access_token: string
          expires_at: string
          id?: number
          refresh_token: string
          scope?: string | null
          token_type: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          expires_at?: string
          id?: number
          refresh_token?: string
          scope?: string | null
          token_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      xero_invoice_links: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          status: string
          updated_at: string
          xero_invoice_id: string
          xero_invoice_number: string
          xero_invoice_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          status: string
          updated_at?: string
          xero_invoice_id: string
          xero_invoice_number: string
          xero_invoice_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          status?: string
          updated_at?: string
          xero_invoice_id?: string
          xero_invoice_number?: string
          xero_invoice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_invoice_links_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_oauth_states: {
        Row: {
          created_at: string
          id: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          state: string
        }
        Update: {
          created_at?: string
          id?: string
          state?: string
        }
        Relationships: []
      }
      xero_tenants: {
        Row: {
          created_at: string
          id: string
          tenant_id: string
          tenant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          tenant_id: string
          tenant_name: string
        }
        Update: {
          created_at?: string
          id?: string
          tenant_id?: string
          tenant_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_organization_membership_exists: {
        Args: {
          user_uuid: string
          org_uuid: string
        }
        Returns: boolean
      }
      count_email_responses: {
        Args: {
          survey_id: string
        }
        Returns: number
      }
      count_survey_responses: {
        Args: {
          survey_id: string
        }
        Returns: number
      }
      count_user_organization_memberships: {
        Args: {
          user_uuid: string
          org_uuid: string
        }
        Returns: number
      }
      create_invitation_with_role: {
        Args: {
          user_email: string
          org_id: string
          role_str: string
          invitation_token: string
          inviter_id: string
          expiry_date: string
        }
        Returns: {
          invitation_id: string
          recipient_email: string
          org_uuid: string
          creation_date: string
        }[]
      }
      create_or_update_profile: {
        Args: {
          profile_id: string
          profile_first_name: string
          profile_last_name: string
          profile_job_title: string
          profile_school_name: string
          profile_school_address: string
        }
        Returns: undefined
      }
      get_organization_invitations: {
        Args: {
          org_id: string
        }
        Returns: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          group_id: string | null
          id: string
          invited_by: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          token: string
        }[]
      }
      get_organization_role: {
        Args: {
          user_uuid: string
          org_id: string
        }
        Returns: string
      }
      get_user_highest_role: {
        Args: {
          user_uuid: string
        }
        Returns: string
      }
      get_user_organizations: {
        Args: {
          user_uuid: string
        }
        Returns: {
          organization_id: string
          role: Database["public"]["Enums"]["user_role_type"]
        }[]
      }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_v2: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      get_user_subscription: {
        Args: {
          user_uuid: string
        }
        Returns: {
          plan: Database["public"]["Enums"]["plan_type"]
          is_active: boolean
        }[]
      }
      has_role_v2: {
        Args: {
          user_uuid: string
          required_role: string
        }
        Returns: boolean
      }
      role_has_permission: {
        Args: {
          user_role: string
          required_role: string
        }
        Returns: boolean
      }
      user_can_edit_survey: {
        Args: {
          user_uuid: string
          template_id: string
        }
        Returns: boolean
      }
      user_can_view_survey: {
        Args: {
          user_uuid: string
          template_id: string
        }
        Returns: boolean
      }
      user_has_access: {
        Args: {
          user_uuid: string
          required_plan: Database["public"]["Enums"]["plan_type"]
        }
        Returns: boolean
      }
      user_has_organization_role: {
        Args: {
          user_uuid: string
          org_id: string
          required_role: Database["public"]["Enums"]["user_role_type"]
        }
        Returns: boolean
      }
      user_has_organization_role_v2: {
        Args: {
          user_uuid: string
          org_id: string
          required_role: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrator" | "user"
      descriptor_status:
        | "Not Started"
        | "In Progress"
        | "Blocked"
        | "Completed"
        | "Not Applicable"
      payment_method: "stripe" | "invoice" | "manual"
      payment_status:
        | "pending"
        | "invoice_raised"
        | "payment_made"
        | "cancelled"
        | "refunded"
      plan_type: "free" | "foundation" | "progress" | "premium"
      role_hierarchy_level: "system" | "group" | "organization" | "standard"
      subscription_status: "active" | "canceled" | "expired" | "pending"
      survey_status: "Saved" | "Scheduled" | "Sent" | "Completed" | "Archived"
      user_role_type:
        | "administrator"
        | "group_admin"
        | "organization_admin"
        | "editor"
        | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
