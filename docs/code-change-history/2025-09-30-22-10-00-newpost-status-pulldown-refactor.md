# NewPost Status Pulldown Refactor

**Date:** 2025-09-30 22:10:00  
**Change Type:** Feature Enhancement  
**Scope:** NewPost Page and WysimarkEditor Component  

## Summary

Refactored the NewPost page to move the status pulldown next to the save button and removed the publish button. The status now controls whether a post is published, and the save functionality has been simplified to use a single save button with status-based publishing.

## Changes Made

### 1. WysimarkEditor Component (`src/components/WysimarkEditor.tsx`)

**Interface Changes:**
- Removed `onPublish` prop from `WysimarkEditorProps`
- Added `status` prop with type `'draft' | 'published' | 'archived'`
- Added `onStatusChange` callback prop
- Updated `onSave` callback to use `status` parameter instead of `isDraft`

**Functionality Changes:**
- Removed `handlePublish` function entirely
- Updated `handleSave` and `handleAutoSave` to use the `status` prop
- Added status dropdown to both normal and fullscreen toolbars
- Removed publish button from both toolbars
- Updated save button to use status-based logic

**UI Changes:**
- Added status dropdown next to save button in toolbar
- Removed publish button from toolbar
- Status dropdown includes: Draft, Published, Archived
- Imported `Select` component from `@radix-ui/themes`

### 2. NewPost Page (`src/pages/NewPost.tsx`)

**State Changes:**
- Updated status type from `'draft' | 'published' | 'hidden'` to `'draft' | 'published' | 'archived'`
- Removed status dropdown from page header (moved to WysimarkEditor)

**Function Changes:**
- Removed `handlePublish` function entirely
- Updated `handleSave` to accept `saveStatus` parameter instead of `isDraft`
- Updated `handleStatusChange` to use correct status types
- Updated API calls to use `saveStatus` for both `published` and `status` fields

**Props Changes:**
- Removed `onPublish` prop from WysimarkEditor
- Added `status` and `onStatusChange` props to WysimarkEditor

### 3. Database Constraint Discovery

**Issue Found:**
- Database only allows statuses: `'draft'`, `'published'`, `'archived'`
- `'hidden'` and `'deleted'` statuses are not allowed by database constraints
- Updated frontend to match database constraints

## Technical Details

### API Integration
- Posts are created with `published: status === 'published'`
- Status field is set to the selected status value
- All valid statuses (draft, published, archived) work correctly
- Invalid statuses are properly rejected by the database

### Status Logic
- **Draft**: `published: false`, `status: 'draft'`
- **Published**: `published: true`, `status: 'published'`
- **Archived**: `published: false`, `status: 'archived'`

### Error Handling
- Proper error handling for invalid statuses
- Database constraint violations are caught and displayed
- User feedback through error messages

## Testing

### API Testing
- ✅ All valid statuses (draft, published, archived) work correctly
- ✅ Invalid statuses are properly rejected
- ✅ Edge cases (empty title, long content) handled correctly
- ✅ Database constraints enforced properly

### Frontend Testing
- ✅ Status dropdown appears next to save button
- ✅ Publish button removed from toolbar
- ✅ Status changes trigger unsaved changes detection
- ✅ Save button works with all statuses
- ✅ Navigation to edit page after save works correctly

## Files Modified

1. `src/components/WysimarkEditor.tsx` - Major refactor
2. `src/pages/NewPost.tsx` - Updated to use new WysimarkEditor interface

## Breaking Changes

- Removed `onPublish` prop from WysimarkEditor
- Changed `onSave` callback signature from `(content, title, isDraft)` to `(content, title, status)`
- Status type changed from including `'hidden'` to including `'archived'`

## Migration Notes

- Any components using WysimarkEditor need to be updated to:
  - Remove `onPublish` prop
  - Add `status` and `onStatusChange` props
  - Update `onSave` callback to handle status parameter
  - Use valid status values: `'draft'`, `'published'`, `'archived'`

## Related Issues

- Fixed database constraint mismatch between frontend and backend
- Simplified post creation workflow by removing separate publish button
- Improved UX by consolidating status and save controls
