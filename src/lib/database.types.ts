
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "profile": {
                  Row: {
                    "ist_admin": boolean,"user_id": string,"veranstalter_id": string | null
                  }
                  Insert: {
                    "ist_admin"?: boolean,"user_id": string,"veranstalter_id"?: string | null
                  }
                  Update: {
                    "ist_admin"?: boolean,"user_id"?: string,"veranstalter_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_veranstalter_id_fkey"
      columns: ["veranstalter_id"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    }
                  ]
                },"raeume": {
                  Row: {
                    "id": string,"name": string,"sortierung": number
                  }
                  Insert: {
                    "id": string,"name": string,"sortierung"?: number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"sortierung"?: number
                  }
                  Relationships: [
                    
                  ]
                },"reservierungen": {
                  Row: {
                    "ansprechpartner": string | null,"eingetragen_von": string | null,"erstellt_am": string,"geaendert_am": string,"gesperrt": boolean,"id": string,"raum_id": string,"telefon": string | null,"termin_id": string | null,"veranstalter_id": string | null,"zeitraum": unknown,"zweck": string | null
                  }
                  Insert: {
                    "ansprechpartner"?: string | null,"eingetragen_von"?: string | null,"erstellt_am"?: string,"geaendert_am"?: string,"gesperrt"?: boolean,"id"?: string,"raum_id": string,"telefon"?: string | null,"termin_id"?: string | null,"veranstalter_id"?: string | null,"zeitraum": unknown,"zweck"?: string | null
                  }
                  Update: {
                    "ansprechpartner"?: string | null,"eingetragen_von"?: string | null,"erstellt_am"?: string,"geaendert_am"?: string,"gesperrt"?: boolean,"id"?: string,"raum_id"?: string,"telefon"?: string | null,"termin_id"?: string | null,"veranstalter_id"?: string | null,"zeitraum"?: unknown,"zweck"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservierungen_eingetragen_von_fkey"
      columns: ["eingetragen_von"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierungen_raum_id_fkey"
      columns: ["raum_id"]
isOneToOne: false
      referencedRelation: "raeume"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierungen_termin_id_fkey"
      columns: ["termin_id"]
isOneToOne: false
      referencedRelation: "termine"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierungen_veranstalter_id_fkey"
      columns: ["veranstalter_id"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    }
                  ]
                },"termine": {
                  Row: {
                    "ansprechpartner": string | null,"beginn": string | null,"beschreibung": string | null,"bis_datum": string | null,"datum": string,"eingetragen_von": string | null,"ende": string | null,"erstellt_am": string,"geaendert_am": string,"id": string,"ort": string | null,"titel": string,"veranstalter_id": string
                  }
                  Insert: {
                    "ansprechpartner"?: string | null,"beginn"?: string | null,"beschreibung"?: string | null,"bis_datum"?: string | null,"datum": string,"eingetragen_von"?: string | null,"ende"?: string | null,"erstellt_am"?: string,"geaendert_am"?: string,"id"?: string,"ort"?: string | null,"titel": string,"veranstalter_id": string
                  }
                  Update: {
                    "ansprechpartner"?: string | null,"beginn"?: string | null,"beschreibung"?: string | null,"bis_datum"?: string | null,"datum"?: string,"eingetragen_von"?: string | null,"ende"?: string | null,"erstellt_am"?: string,"geaendert_am"?: string,"id"?: string,"ort"?: string | null,"titel"?: string,"veranstalter_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "termine_eingetragen_von_fkey"
      columns: ["eingetragen_von"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "termine_veranstalter_id_fkey"
      columns: ["veranstalter_id"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    }
                  ]
                },"veranstalter": {
                  Row: {
                    "aktiv": boolean,"farbe": string,"farbe_hg": string,"gemeinsam": boolean,"id": string,"kuerzel": string,"login_email": string,"logo_url": string | null,"name": string,"sortierung": number
                  }
                  Insert: {
                    "aktiv"?: boolean,"farbe": string,"farbe_hg": string,"gemeinsam"?: boolean,"id": string,"kuerzel": string,"login_email": string,"logo_url"?: string | null,"name": string,"sortierung"?: number
                  }
                  Update: {
                    "aktiv"?: boolean,"farbe"?: string,"farbe_hg"?: string,"gemeinsam"?: boolean,"id"?: string,"kuerzel"?: string,"login_email"?: string,"logo_url"?: string | null,"name"?: string,"sortierung"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "reservierungen_oeffentlich": {
                  Row: {
                    "eingetragen_von": string | null,"gesperrt": boolean | null,"id": string | null,"raum_id": string | null,"veranstalter_id": string | null,"zeitraum": unknown,"zweck": string | null
                  }
                  Insert: {
                           "eingetragen_von"?: string | null,"gesperrt"?: boolean | null,"id"?: string | null,"raum_id"?: string | null,"veranstalter_id"?: string | null,"zeitraum"?: unknown,"zweck"?: string | null
                         }
                        Update: {
                           "eingetragen_von"?: string | null,"gesperrt"?: boolean | null,"id"?: string | null,"raum_id"?: string | null,"veranstalter_id"?: string | null,"zeitraum"?: unknown,"zweck"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "reservierungen_eingetragen_von_fkey"
      columns: ["eingetragen_von"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierungen_raum_id_fkey"
      columns: ["raum_id"]
isOneToOne: false
      referencedRelation: "raeume"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierungen_veranstalter_id_fkey"
      columns: ["veranstalter_id"]
isOneToOne: false
      referencedRelation: "veranstalter"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            [_ in never]: never
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
            
          }
        }
} as const

