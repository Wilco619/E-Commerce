# permissions.py
from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    Read-only permissions are allowed for any request.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to admin users
        return request.user and request.user.is_staff

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin always has permission
        if request.user.is_staff:
            return True
            
        # Check if user is owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class CartPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow guest cart access for specific actions
        if view.action in ['current', 'add_item', 'update_item', 'remove_item', 'clear']:
            return True
        # Require authentication for other actions
        return request.user.is_authenticated