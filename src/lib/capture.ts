import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { useStore } from '@/data/store';
import { keepPhoto } from './photos';

/** Hands a new photo to the processing step. `edit` returns to the edit form afterwards. */
export function startProcessing(uri: string, opts: { replace?: boolean; edit?: boolean } = {}) {
  useStore.getState().setCapture({ originalUri: keepPhoto(uri) });
  const href = { pathname: '/processing' as const, params: opts.edit ? { edit: '1' } : {} };
  if (opts.replace) router.replace(href);
  else router.push(href);
}

export async function pickFromGallery(opts: { replace?: boolean; edit?: boolean } = {}) {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (res.canceled || !res.assets[0]) return false;
  startProcessing(res.assets[0].uri, opts);
  return true;
}

/** Leaves the capture flow once the photo is ready. */
export function finishCapture(edit: boolean) {
  if (edit) router.back();
  else router.replace('/item/new');
}
