import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Pokémon generados por el Constructor y guardados en la Pokédex personal
    pokemonCreations: defineTable({
      userId: v.id("users"),
      name: v.string(),
      displayName: v.string(),
      artwork: v.string(),
      sprite: v.string(),
      types: v.array(v.string()),
      level: v.number(),
      shiny: v.boolean(),
      isSynthetic: v.boolean(),
      sourceNote: v.string(),
      payload: v.any(), // ConstructedPokemon serializado
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // Ciudades guardadas para el clima
    savedCities: defineTable({
      userId: v.id("users"),
      placeId: v.number(),
      name: v.string(),
      country: v.optional(v.string()),
      admin1: v.optional(v.string()),
      latitude: v.number(),
      longitude: v.number(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // Bitácora del chat del asistente Pokéclima
    chatMessages: defineTable({
      userId: v.id("users"),
      role: v.union(v.literal("user"), v.literal("bot")),
      content: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
