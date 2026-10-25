import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const portfolioContent = sqliteTable("portfolio_content", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
});
