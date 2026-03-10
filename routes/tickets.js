const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, ticketController.createTicket);
router.get('/', auth, ticketController.getTickets);
router.get('/:id', auth, ticketController.getTicketById);
router.patch('/:id/status', auth, authorize('agent'), ticketController.updateStatus);

module.exports = router;
