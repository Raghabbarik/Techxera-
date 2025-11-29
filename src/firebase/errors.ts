// A specialized error class for Firestore permission errors.
// This class is designed to be thrown by the application when a Firestore
// operation fails due to security rules. It captures the context of the
// operation, such as the path, operation type, and the data being sent.
// This allows for more detailed error reporting and debugging.
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

// This is a custom error that is thrown when a Firestore permission error occurs.
// It is used to provide more context to the user about the error.
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify({ ...context }, null, 2)}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to ensure that the stack trace is captured correctly.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
