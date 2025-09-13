/**
 * Group Controller
 * Handles HTTP requests for group operations
 *
 * @fileoverview TypeScript implementation of the Group controller with full type safety
 */

import { asyncHandler, createNotFoundError, createValidationError } from '@/middleware/errorHandler';
import {
    ApiResponse,
    CreateGroupRequest,
    GroupResponse,
    GroupsResponse,
    PaginationParams,
    UpdateGroupRequest
} from '@/types';
import { NextFunction, Request, Response } from 'express';
import GroupServiceDB from '../services/GroupServiceDB';

/**
 * Group Controller Class
 *
 * This class handles all HTTP requests related to group operations.
 * It provides methods for CRUD operations and group management.
 *
 * Features:
 * - Full TypeScript type safety
 * - Database-backed operations (no in-memory storage)
 * - Comprehensive error handling
 * - Request validation and sanitization
 */
export class GroupController {
    private groupServiceDB: GroupServiceDB;

  constructor() {
    this.groupServiceDB = new GroupServiceDB();
  }

  /**
   * Get all groups
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getAllGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const pagination: PaginationParams = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10
      };

      // Ensure pagination values are defined
      const safePage = pagination.page || 1;
      const safeLimit = pagination.limit || 10;

      let groups;
      if (search) {
        groups = await this.groupServiceDB.searchGroups(search as string);
      } else {
        groups = await this.groupServiceDB.getAllGroups();
      }

      // Simple pagination
      const startIndex = (safePage - 1) * safeLimit;
      const endIndex = startIndex + safeLimit;
      const paginatedGroups = groups.slice(startIndex, endIndex);

      const response: GroupsResponse = {
        success: true,
        data: paginatedGroups,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: groups.length,
          totalPages: Math.ceil(groups.length / safeLimit),
          hasNext: endIndex < groups.length,
          hasPrev: safePage > 1
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get a specific group by ID
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getGroupById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID is required',
          value: id
        }]);
      }

      const group = await this.groupServiceDB.getGroupById(id);

      const response: GroupResponse = {
        success: true,
        data: group,
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group');
      }
      next(error);
    }
  });

  /**
   * Create a new group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public createGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupData: CreateGroupRequest = req.body;

      // Validate required fields
      if (!groupData.name || groupData.name.trim() === '') {
        throw createValidationError([{
          field: 'name',
          message: 'Group name is required',
          value: groupData.name
        }]);
      }

      const group = await this.groupServiceDB.createGroup(groupData);

      const response: GroupResponse = {
        success: true,
        data: group,
        message: 'Group created successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Update a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public updateGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateGroupRequest = req.body;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID is required',
          value: id
        }]);
      }

      // Validate update data
      if (updateData.name !== undefined && (!updateData.name || updateData.name.trim() === '')) {
        throw createValidationError([{
          field: 'name',
          message: 'Group name cannot be empty',
          value: updateData.name
        }]);
      }

      const group = await this.groupServiceDB.updateGroup(id, updateData);

      const response: GroupResponse = {
        success: true,
        data: group,
        message: 'Group updated successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group');
      }
      next(error);
    }
  });

  /**
   * Delete a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public deleteGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID is required',
          value: id
        }]);
      }

      await this.groupServiceDB.deleteGroup(id);

      const response: ApiResponse = {
        success: true,
        message: 'Group deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group');
      }
      next(error);
    }
  });

  /**
   * Add member to group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public addMemberToGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { email, name } = req.body;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID is required',
          value: id
        }]);
      }

      if (!email || !name) {
        throw createValidationError([{
          field: 'email',
          message: 'Email and name are required',
          value: { email, name }
        }]);
      }

      const memberData = {
        id: Date.now().toString(), // Generate temporary ID
        name: name.trim(),
        email: email.trim()
      };

      const group = await this.groupServiceDB.addMemberToGroup(id, memberData);

      const response: GroupResponse = {
        success: true,
        data: group,
        message: 'Member added to group successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group');
      }
      next(error);
    }
  });

  /**
   * Remove member from group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public removeMemberFromGroup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, memberId } = req.params;

      if (!id || !memberId) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID and Member ID are required',
          value: { id, memberId }
        }]);
      }

      const group = await this.groupServiceDB.removeMemberFromGroup(id, memberId);

      const response: GroupResponse = {
        success: true,
        data: group,
        message: 'Member removed from group successfully',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group or Member');
      }
      next(error);
    }
  });

  /**
   * Get group expenses
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getGroupExpenses = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID is required',
          value: id
        }]);
      }

      const expenses = await this.groupServiceDB.getGroupExpenses(id);

      const response: ApiResponse = {
        success: true,
        data: expenses,
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group');
      }
      next(error);
    }
  });

  /**
   * Get group statistics
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public getGroupStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createValidationError([{
          field: 'id',
          message: 'Group ID is required',
          value: id
        }]);
      }

      const stats = await this.groupServiceDB.getGroupStats(id);

      const response: ApiResponse = {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw createNotFoundError('Group');
      }
      next(error);
    }
  });

  /**
   * Search groups
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  public searchGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q || (q as string).trim() === '') {
        throw createValidationError([{
          field: 'q',
          message: 'Search query is required',
          value: q
        }]);
      }

      const groups = await this.groupServiceDB.searchGroups(q as string);

      const response: GroupsResponse = {
        success: true,
        data: groups,
        pagination: {
          page: 1,
          limit: groups.length,
          total: groups.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });
}

export default GroupController;
