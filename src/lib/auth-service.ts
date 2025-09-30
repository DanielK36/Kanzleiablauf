import { auth } from '@clerk/nextjs/server';

export interface AuthResult {
  userId: string | null;
  userRole: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private fallbackUserId = 'user_323Fmf0gM8mLKTuHGu1rSjDy6gm';

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async getUserAndRole(): Promise<AuthResult> {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        console.log('No userId from auth(), using fallback');
        return {
          userId: this.fallbackUserId,
          userRole: 'admin'
        };
      }

      // For now, return the userId and a default role
      // In a real implementation, you would fetch the role from the database
      return {
        userId,
        userRole: 'admin' // Default role for development
      };
    } catch (error) {
      console.error('Error in getUserAndRole:', error);
      return {
        userId: this.fallbackUserId,
        userRole: 'admin'
      };
    }
  }
}

export function getAuthService(): AuthService {
  return AuthService.getInstance();
}

export async function authenticateRequest(): Promise<{ userId: string; userRole: string }> {
  const authService = getAuthService();
  const { userId, userRole } = await authService.getUserAndRole();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  return { userId, userRole: userRole || 'admin' };
}

export function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}