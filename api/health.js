module.exports = async function healthHandler(req, res) {
  return res.status(200).json({ status: 'OK', message: 'Meal Planner API is running' });
}; 