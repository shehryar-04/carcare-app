const subscriberService = require('../services/subscriptionService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new subscriber
exports.addSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    const existingSubscriber = await subscriberService.getSubscriberByEmail(email);

    if (existingSubscriber) {
      return res.status(200).json({
        msg: 'This email is already subscribed.'
      });
    }

    await subscriberService.addSubscriber(email);
    res.status(201).json({
      msg: 'Email added successfully.'
    });
  } catch (error) {
    handleErrorResponse(res, error, 'Error adding Subscriber');
  }
};

// Get all blogs
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await subscriberService.getAllSubscribers();
    res.status(200).json(subscribers);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving Subscribers');
  }
};
