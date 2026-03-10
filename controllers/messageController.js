const Message = require('../models/Message');
const Ticket = require('../models/Ticket');

exports.getMessages = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const messages = await Message.find({ ticketId }).sort({ createdAt: 1 });

        // Reset unread count for the current user's role
        const ticket = await Ticket.findById(ticketId);
        if (ticket) {
            const role = req.user.role;
            ticket.unreadCount[role] = 0;
            await ticket.save();
        }

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { ticketId, message, attachments } = req.body;
        const newMessage = new Message({
            ticketId,
            senderId: req.user._id,
            senderRole: req.user.role,
            message,
            attachments
        });
        await newMessage.save();

        // Update ticket's last message and unread count
        const ticket = await Ticket.findById(ticketId);
        ticket.lastMessage = message;
        ticket.updatedAt = Date.now();

        // Increment unread count for the OTHER role
        const otherRole = req.user.role === 'customer' ? 'agent' : 'customer';
        ticket.unreadCount[otherRole] += 1;

        await ticket.save();

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
