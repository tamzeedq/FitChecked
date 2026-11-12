
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "items": {
                  Row: {
                    "bg_hue": number,"category": string,"color": string,"created_at": string,"deleted_at": string | null,"favorite": boolean,"id": string,"name": string,"original_path": string | null,"photo_path": string | null,"silhouette": Json | null,"tags": (string)[],"tile_delta": number | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bg_hue"?: number,"category": string,"color": string,"created_at"?: string,"deleted_at"?: string | null,"favorite"?: boolean,"id"?: string,"name": string,"original_path"?: string | null,"photo_path"?: string | null,"silhouette"?: Json | null,"tags"?: (string)[],"tile_delta"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "bg_hue"?: number,"category"?: string,"color"?: string,"created_at"?: string,"deleted_at"?: string | null,"favorite"?: boolean,"id"?: string,"name"?: string,"original_path"?: string | null,"photo_path"?: string | null,"silhouette"?: Json | null,"tags"?: (string)[],"tile_delta"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"outfit_items": {
                  Row: {
                    "item_id": string,"outfit_id": string,"position": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "item_id": string,"outfit_id": string,"position"?: number,"user_id"?: string
                  }
                  Update: {
                    "item_id"?: string,"outfit_id"?: string,"position"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_items_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "item_wear_stats"
      referencedColumns: ["item_id","user_id"]
    },{
      foreignKeyName: "outfit_items_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "outfit_items_outfit_id_user_id_fkey"
      columns: ["outfit_id","user_id"]
isOneToOne: false
      referencedRelation: "outfit_wear_stats"
      referencedColumns: ["outfit_id","user_id"]
    },{
      foreignKeyName: "outfit_items_outfit_id_user_id_fkey"
      columns: ["outfit_id","user_id"]
isOneToOne: false
      referencedRelation: "outfits"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"outfits": {
                  Row: {
                    "archived": boolean,"created_at": string,"id": string,"name": string,"note": string | null,"tags": (string)[],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"name": string,"note"?: string | null,"tags"?: (string)[],"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"note"?: string | null,"tags"?: (string)[],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "display_name": string,"member_since": string,"settings": NonNullable<Json>,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "display_name"?: string,"member_since"?: string,"settings"?: NonNullable<Json>,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "display_name"?: string,"member_since"?: string,"settings"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"recent_searches": {
                  Row: {
                    "created_at": string,"id": string,"query": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"query": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"query"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tag_groups": {
                  Row: {
                    "hue": number,"name": string,"tags": (string)[],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hue"?: number,"name": string,"tags"?: (string)[],"user_id"?: string
                  }
                  Update: {
                    "hue"?: number,"name"?: string,"tags"?: (string)[],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wear_log": {
                  Row: {
                    "created_at": string,"day": string,"id": string,"outfit_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"day": string,"id"?: string,"outfit_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"day"?: string,"id"?: string,"outfit_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wear_log_outfit_id_user_id_fkey"
      columns: ["outfit_id","user_id"]
isOneToOne: false
      referencedRelation: "outfit_wear_stats"
      referencedColumns: ["outfit_id","user_id"]
    },{
      foreignKeyName: "wear_log_outfit_id_user_id_fkey"
      columns: ["outfit_id","user_id"]
isOneToOne: false
      referencedRelation: "outfits"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Views: {
            "item_wear_stats": {
                  Row: {
                    "item_id": string,"last_worn": string | null,"user_id": string,"wear_count": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"outfit_wear_stats": {
                  Row: {
                    "last_worn": string | null,"outfit_id": string,"user_id": string,"wear_count": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
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
