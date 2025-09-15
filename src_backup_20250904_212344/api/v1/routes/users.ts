// src/api/v1/routes/users.ts - Updated with role-based authorization
import { Router } from 'express';
import { storage } from '../../../../server/storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { AuthenticatedRequest, authorize, authorizeOwnership } from '../../../middleware/auth';
import bcrypt from 'bcrypt';

export function registerUserRoutes(router: Router) {
  // User login - public route
  router.post("/login", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          error: {
            type: "ValidationError",
            message: "Password is required",
            details: { field: "password" }
          }
        });
      }
      
      // Find user by username or email
      let user;
      if (username) {
        user = await storage.getUserByUsername(username);
      } else if (email) {
        const users = await storage.getUsers();
        user = users.find(u => u.email === email);
      } else {
        return res.status(400).json({
          error: {
            type: "ValidationError",
            message: "Username or email is required",
            details: { field: "username_or_email" }
          }
        });
      }
      
      if (!user || !user.password) {
        return res.status(401).json({
          error: {
            type: "AuthenticationError",
            message: "Invalid credentials",
            details: {}
          }
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: {
            type: "AuthenticationError",
            message: "Invalid credentials",
            details: {}
          }
        });
      }
      
      // Don't return the password in the response
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        data: userWithoutPassword,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({
        error: {
          type: "ServerError",
          message: "Failed to login",
          details: {}
        }
      });
    }
  });

  // User registration - public route
  router.post("/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      if (userData.username) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          return res.status(409).json({ 
            error: {
              type: "ConflictError",
              message: "Username already exists",
              details: { field: "username" }
            }
          });
        }
      }
      
      // Check if email already exists
      const existingUsers = await storage.getUsers();
      const emailExists = existingUsers.some(user => user.email === userData.email);
      if (emailExists) {
        return res.status(409).json({ 
          error: {
            type: "ConflictError",
            message: "Email already exists",
            details: { field: "email" }
          }
        });
      }
      
      // Hash password if provided
      if (userData.password) {
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: "User registered successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: {
            type: "ValidationError",
            message: "Invalid user data",
            details: error.errors.reduce((acc, err) => {
              acc[err.path.join('.')] = err.message;
              return acc;
            }, {} as Record<string, string>)
          }
        });
      }
      
      console.error("Error registering user:", error);
      res.status(500).json({ 
        error: {
          type: "ServerError",
          message: "Failed to register user",
          details: {}
        }
      });
    }
  });

  // Get user profile - requires authentication and ownership
  router.get("/:userId", authorizeOwnership('userId'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return sensitive information
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile - requires authentication and ownership
  router.put("/:userId", authorizeOwnership('userId'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Validate update data
      const updateData = req.body;
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return sensitive information
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin-only: Get all users
  router.get("/", authorize(['admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin-only: Delete user
  router.delete("/:userId", authorize(['admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
}
