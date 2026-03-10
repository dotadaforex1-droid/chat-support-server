const Ticket = require('../models/Ticket');
const Message = require('../models/Message');

exports.createTicket = async (req, res) => {
    try {
        const { subject, category, message, priority } = req.body;
        const ticket = new Ticket({
            userId: req.user._id,
            subject,
            category,
            priority: priority || 'Medium',
            lastMessage: message
        });
        await ticket.save();

        // Create initial message
        const firstMessage = new Message({
            ticketId: ticket._id,
            senderId: req.user._id,
            senderRole: 'customer',
            message
        });
        await firstMessage.save();

        res.status(201).json({ ticket, message: firstMessage });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTickets = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'customer') {
            query.userId = req.user._id;
        }

        const tickets = await Ticket.find(query).populate('userId', 'name email').sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('userId', 'name email');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Authorization check
        if (req.user.role === 'customer' && ticket.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        res.json(ticket);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
