/**
 * Das Instagram-Handy im Startseiten-Kopf meldet per Window-Event, ob es gerade
 * sichtbar ist. Neeles schwebende Kontaktkarte blendet sich solange aus,
 * damit sie das Handy nicht verdeckt.
 */
export const INSTAGRAM_PHONE_VISIBLE_EVENT = "k24:instagram-phone-visible";

export const announceInstagramPhoneVisible = (visible: boolean) => {
  window.dispatchEvent(new CustomEvent<boolean>(INSTAGRAM_PHONE_VISIBLE_EVENT, { detail: visible }));
};
