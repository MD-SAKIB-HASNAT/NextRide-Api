export enum UserRole {
  USER = 'user',
  ORGANIZATION = 'organization',
  ADMIN = 'admin',
}
export enum UserStatus {
  PENDING = 'pending',            // email not verified
  PENDING_APPROVAL = 'pending_approval', // organization awaiting admin approval
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}
