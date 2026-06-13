import api from '../utils/api';

export const getProfile = async () => {
  const res = await api.get('/api/leads/auth/me/');
  return res.data?.user ?? null;
};

export const updateProfile = async (formData) => {
  // formData should be FormData when including files
  // Let the browser set the multipart Content-Type (with boundary) automatically.
  const config = formData instanceof FormData ? {} : {};
  const res = await api.patch('/api/leads/auth/me/', formData, config);
  return res.data;
};

export const fetchTeamData = async () => {
  const res = await api.get('/api/leads/team/');
  return res.data;
};
