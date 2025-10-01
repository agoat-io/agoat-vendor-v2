# NewPost Status Pulldown Refactor - Requirement Change Request

**Date:** 2025-09-30 22:10:00  
**Request Type:** Feature Enhancement  
**Priority:** High  
**Status:** Implemented  

## Change Request Summary

Refactor the NewPost page to move the status pulldown next to the save button and remove the publish button. The status should control whether a post is published, simplifying the post creation workflow.

## Original Requirements

- NewPost page had separate status dropdown in header
- Separate publish button in WysimarkEditor toolbar
- Save button only saved as draft
- Publish button published immediately
- Status dropdown was separate from save/publish controls

## Requested Changes

### 1. UI/UX Changes
- Move status pulldown next to save button in WysimarkEditor toolbar
- Remove publish button from WysimarkEditor toolbar
- Consolidate status and save controls in one location
- Simplify post creation workflow

### 2. Functional Changes
- Status dropdown should control whether post is published
- Single save button should respect the selected status
- Remove separate publish functionality
- Status changes should trigger unsaved changes detection

### 3. Technical Changes
- Update WysimarkEditor interface to remove onPublish prop
- Add status and onStatusChange props to WysimarkEditor
- Update save logic to use status parameter
- Ensure database constraints are respected

## Business Justification

1. **Simplified Workflow**: Users can now set status and save in one action
2. **Reduced Confusion**: No need to choose between save and publish
3. **Better UX**: Status and save controls are co-located
4. **Consistent Behavior**: Status always controls publication state

## Impact Analysis

### Positive Impacts
- Simplified user interface
- Reduced cognitive load for users
- More intuitive post creation workflow
- Better alignment with user expectations

### Potential Risks
- Breaking change for existing integrations
- Need to update any components using WysimarkEditor
- Database constraint validation required

## Implementation Details

### Status Values
- **Draft**: Post is saved but not published
- **Published**: Post is saved and published immediately
- **Archived**: Post is saved but archived (not published)

### Database Constraints
- Only `'draft'`, `'published'`, and `'archived'` statuses are allowed
- `'hidden'` and `'deleted'` statuses are not supported by database

### API Changes
- Posts created with `published: status === 'published'`
- Status field set to selected status value
- All valid statuses work correctly with database constraints

## Acceptance Criteria

- [x] Status pulldown appears next to save button in WysimarkEditor toolbar
- [x] Publish button removed from WysimarkEditor toolbar
- [x] Status dropdown includes: Draft, Published, Archived
- [x] Save button respects selected status
- [x] Status changes trigger unsaved changes detection
- [x] All valid statuses work correctly with API
- [x] Invalid statuses are properly rejected
- [x] Navigation to edit page after save works correctly
- [x] No JavaScript errors in browser console
- [x] All existing functionality preserved

## Testing Results

### API Testing
- ✅ All valid statuses (draft, published, archived) work correctly
- ✅ Invalid statuses are properly rejected by database
- ✅ Edge cases (empty title, long content) handled correctly
- ✅ Database constraints enforced properly

### Frontend Testing
- ✅ Status dropdown appears next to save button
- ✅ Publish button removed from toolbar
- ✅ Status changes trigger unsaved changes detection
- ✅ Save button works with all statuses
- ✅ Navigation to edit page after save works correctly
- ✅ No linting errors
- ✅ No JavaScript runtime errors

## Migration Notes

Components using WysimarkEditor need to be updated to:
- Remove `onPublish` prop
- Add `status` and `onStatusChange` props
- Update `onSave` callback to handle status parameter
- Use valid status values: `'draft'`, `'published'`, `'archived'`

## Related Documentation

- Code Change History: `2025-09-30-22-10-00-newpost-status-pulldown-refactor.md`
- Technical Implementation: Updated WysimarkEditor and NewPost components
- API Documentation: Status field constraints and validation

## Approval

**Status:** ✅ Implemented and Tested  
**Date Completed:** 2025-09-30 22:10:00  
**Testing Status:** All tests passed  
**Ready for Production:** Yes
