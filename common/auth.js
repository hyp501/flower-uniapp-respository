export function getAuthPayload() {
  const token = uni.getStorageSync('uni_id_token') || '';
  const current = uniCloud.getCurrentUserInfo ? uniCloud.getCurrentUserInfo() : {};
  const uid = current && current.uid ? current.uid : '';
  return {
    uniIdToken: token,
    uid
  };
}

export function hasLogin() {
  const current = uniCloud.getCurrentUserInfo ? uniCloud.getCurrentUserInfo() : {};
  return !!(current && current.uid);
}
