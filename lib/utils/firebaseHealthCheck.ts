import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import EnhancedAlert from '@/components/EnhancedAlert';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class FirebaseHealthCheck {
  static async checkConnection(): Promise<HealthCheckResult> {
    try {
      // Test basic Firestore connection
      await getDocs(collection(db, 'health-check'));
      return {
        status: 'healthy',
        message: 'Firebase connection is working'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Firebase connection failed',
        details: error.message
      };
    }
  }

  static async checkAuth(): Promise<HealthCheckResult> {
    try {
      const user = auth.currentUser;
      if (user) {
        return {
          status: 'healthy',
          message: 'User is authenticated'
        };
      } else {
        return {
          status: 'warning',
          message: 'No user authenticated'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Auth check failed',
        details: error.message
      };
    }
  }

  static async checkReadWrite(userEmail?: string): Promise<HealthCheckResult> {
    try {
      // Test write operation
      const testDoc = {
        test: true,
        timestamp: new Date(),
        user: userEmail || 'anonymous'
      };
      
      const docRef = await addDoc(collection(db, 'health-check'), testDoc);
      
      // Test read operation
      await getDocs(collection(db, 'health-check'));
      
      // Clean up test document
      await deleteDoc(doc(db, 'health-check', docRef.id));
      
      return {
        status: 'healthy',
        message: 'Read/write operations working'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Read/write operations failed',
        details: error.message
      };
    }
  }

  static async checkTenantAccess(userEmail: string): Promise<HealthCheckResult> {
    try {
      const { getTenantId } = await import('../services/firebaseService');
      const tenantId = await getTenantId(userEmail);
      
      if (!tenantId) {
        return {
          status: 'error',
          message: 'No tenant access found for user'
        };
      }

      // Test tenant collection access
      await getDocs(collection(db, `tenants/${tenantId}/customers`));
      
      return {
        status: 'healthy',
        message: `Tenant access working (${tenantId})`
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Tenant access check failed',
        details: error.message
      };
    }
  }

  static async runFullHealthCheck(userEmail?: string): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    checks: Record<string, HealthCheckResult>;
  }> {
    const checks: Record<string, HealthCheckResult> = {};
    
    // Run all health checks
    checks.connection = await this.checkConnection();
    checks.auth = await this.checkAuth();
    checks.readWrite = await this.checkReadWrite(userEmail);
    
    if (userEmail) {
      checks.tenantAccess = await this.checkTenantAccess(userEmail);
    }

    // Determine overall status
    const hasError = Object.values(checks).some(check => check.status === 'error');
    const hasWarning = Object.values(checks).some(check => check.status === 'warning');
    
    const overall = hasError ? 'error' : hasWarning ? 'warning' : 'healthy';

    return { overall, checks };
  }

  static async diagnoseAndReport(userEmail?: string): Promise<void> {
    const { overall, checks } = await this.runFullHealthCheck(userEmail);
    
    if (overall === 'healthy') {
      EnhancedAlert.success(
        'Firebase Health Check',
        'All Firebase services are working correctly.'
      );
      return;
    }

    // Build detailed error report
    const issues = Object.entries(checks)
      .filter(([_, check]) => check.status !== 'healthy')
      .map(([name, check]) => `• ${name}: ${check.message}`)
      .join('\n');

    if (overall === 'error') {
      EnhancedAlert.error(
        'Firebase Issues Detected',
        `Critical Firebase problems found:\n\n${issues}\n\nPlease check your internet connection and try again.`
      );
    } else {
      EnhancedAlert.warning(
        'Firebase Warnings',
        `Some Firebase issues detected:\n\n${issues}\n\nThe app may still work but with limited functionality.`
      );
    }
  }

  static async quickConnectionTest(): Promise<boolean> {
    try {
      await getDocs(collection(db, 'health-check'));
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  }
}

// Auto-run health check on app start (development only)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    FirebaseHealthCheck.diagnoseAndReport();
  }, 2000);
}

export default FirebaseHealthCheck;