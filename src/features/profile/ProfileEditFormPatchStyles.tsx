import './profile-form-patch.css';

/** Side-effect import: mount only under `/profile/edit` so patch CSS loads with that view. */
export function ProfileEditFormPatchStyles() {
  return null;
}
