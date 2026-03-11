const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

const socketManager = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_ticket', ({ ticketId }) => {
            socket.join(ticketId);
            console.log(`Socket ${socket.id} joined ticket room ${ticketId}`);
        });

        socket.on('send_message', async (data) => {
            const { ticketId, senderId, senderRole, message, attachments, tempId } = data;

            const newMessage = new Message({
                ticketId,
                senderId,
                senderRole,
                message,
                attachments
            });
            await newMessage.save();

            // Update ticket
            const ticket = await Ticket.findById(ticketId);
            ticket.lastMessage = message;
            ticket.updatedAt = Date.now();
            const otherRole = senderRole === 'customer' ? 'agent' : 'customer';
            ticket.unreadCount[otherRole] += 1;
            await ticket.save();

            // Broadcast to the room, including the tempId so the sender can match it
            io.to(ticketId).emit('receive_message', { ...newMessage.toObject(), tempId });


            // If it's an agent, also emit update to the ticket list for all agents
            if (senderRole === 'agent') {
                io.emit('ticket_updated', ticket);
            }
        });

        socket.on('typing', ({ ticketId, userName, senderRole, isTyping }) => {
            socket.to(ticketId).emit('user_typing', { userName, senderRole, isTyping });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};

module.exports = socketManager;
