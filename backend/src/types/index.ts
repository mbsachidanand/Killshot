/**
 * Type Definitions for Killshot Backend
 * Centralized type definitions for the expense splitting application
 */

// ============================================================================
// Database Types
// ============================================================================

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  pool?: {
    min: number;
    max: number;
  };
}

/**
 * Database query result
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

/**
 * Database transaction
 */
export interface Transaction {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// ============================================================================
// Model Types
// ============================================================================

/**
 * User model
 */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Group member
 */
export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
}

/**
 * Expense split detail
 */
export interface SplitDetail {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
}

/**
 * Expense model
 */
export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  description?: string;
  paidBy: string;
  splitType: 'equal' | 'percentage' | 'exact';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  splits: SplitDetail[];
}

/**
 * Group model
 */
export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMember[];
  expenses: Expense[];
  totalExpenses: number;
  memberCount: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Group API Types
// ============================================================================

/**
 * Create group request
 */
export interface CreateGroupRequest {
  name: string;
  description: string;
  memberEmails?: string[];
}

/**
 * Update group request
 */
export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

/**
 * Add member request
 */
export interface AddMemberRequest {
  email: string;
  name: string;
}

/**
 * Group response
 */
export interface GroupResponse extends ApiResponse<Group> {}

/**
 * Groups response
 */
export interface GroupsResponse extends PaginatedResponse<Group> {}

// ============================================================================
// Expense API Types
// ============================================================================

/**
 * Create expense request
 */
export interface CreateExpenseRequest {
  title: string;
  amount: number;
  description?: string;
  paidBy: string;
  groupId: string;
  splitType: 'equal' | 'percentage' | 'exact';
  date: string;
  splits?: {
    userId: string;
    amount?: number;
    percentage?: number;
  }[];
}

/**
 * Update expense request
 */
export interface UpdateExpenseRequest {
  title?: string;
  amount?: number;
  description?: string;
  paidBy?: string;
  splitType?: 'equal' | 'percentage' | 'exact';
  date?: string;
  splits?: {
    userId: string;
    amount?: number;
    percentage?: number;
  }[];
}

/**
 * Expense response
 */
export interface ExpenseResponse extends ApiResponse<Expense> {}

/**
 * Expenses response
 */
export interface ExpensesResponse extends PaginatedResponse<Expense> {}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  name?: string;
  field: string;
  message: string;
  value?: any;
}

/**
 * API error response
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  details?: ValidationError[];
  stack?: string;
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Database adapter interface
 */
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}

/**
 * Service interface
 */
export interface Service<T, CreateType, UpdateType> {
  create(data: CreateType): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, data: UpdateType): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// ============================================================================
// Middleware Types
// ============================================================================

/**
 * Request with additional properties
 */
export interface RequestWithId extends Express.Request {
  id?: string;
}

/**
 * Error handler function
 */
export type ErrorHandler = (
  err: Error,
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => void;

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  apiVersion: string;
  corsOrigin: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

/**
 * Environment variables
 */
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  API_VERSION: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  DB_TYPE: 'postgresql' | 'mysql' | 'sqlite';
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Make all properties required
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Pick specific properties
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Omit specific properties
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Database entity with timestamps
 */
export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database entity with ID
 */
export interface Entity {
  id: string;
}

/**
 * Full database entity
 */
export type DatabaseEntity = Entity & TimestampedEntity;
