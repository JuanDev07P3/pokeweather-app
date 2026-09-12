import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ------------------------- Pokémon creados ------------------------- */

export const listCreations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("pokemonCreations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const saveCreation = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    artwork: v.string(),
    sprite: v.string(),
    types: v.array(v.string()),
    level: v.number(),
    shiny: v.boolean(),
    isSynthetic: v.boolean(),
    sourceNote: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Debes iniciar sesión.");
    return await ctx.db.insert("pokemonCreations", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteCreation = mutation({
  args: { id: v.id("pokemonCreations") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Debes iniciar sesión.");
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error("No encontrado.");
    await ctx.db.delete(id);
  },
});

/* --------------------------- Ciudades ------------------------------ */

export const listCities = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("savedCities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const saveCity = mutation({
  args: {
    placeId: v.number(),
    name: v.string(),
    country: v.optional(v.string()),
    admin1: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Debes iniciar sesión.");
    const existing = await ctx.db
      .query("savedCities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const dup = existing.find((c) => c.placeId === args.placeId);
    if (dup) return dup._id;
    return await ctx.db.insert("savedCities", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteCity = mutation({
  args: { id: v.id("savedCities") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Debes iniciar sesión.");
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error("No encontrado.");
    await ctx.db.delete(id);
  },
});

/* ----------------------------- Chat -------------------------------- */

const MAX_MESSAGES = 40;

export const listChat = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_MESSAGES);
  },
});

export const addChatMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("bot")),
    content: v.string(),
  },
  handler: async (ctx, { role, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Debes iniciar sesión.");
    await ctx.db.insert("chatMessages", {
      userId,
      role,
      content,
      createdAt: Date.now(),
    });
    // poda: conserva solo los últimos MAX_MESSAGES
    const all = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    for (const old of all.slice(MAX_MESSAGES)) {
      await ctx.db.delete(old._id);
    }
  },
});

export const clearChat = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Debes iniciar sesión.");
    const all = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const m of all) await ctx.db.delete(m._id);
  },
});
