const express = require('express');
const router = express.Router();
const { protect } = require('./middleware'); // CORRECTED: Path now points to the correct file in the same directory
const Proposal = require('../models/proposal');

// This route can be public
router.get('/', async (req, res) => {
    try {
        const proposals = await Proposal.find().sort({ supporterCount: -1 });
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching proposals', error: error.message });
    }
});

// These routes must be protected
router.post('/', protect, async (req, res) => {
    try {
        const newProposal = new Proposal({
            ...req.body,
            creatorId: req.user.id // Get the creator's ID from the authenticated user
        });
        await newProposal.save();
        res.status(201).json(newProposal);
    } catch (error) {
        res.status(500).json({ message: 'Error creating proposal', error: error.message });
    }
});

router.post('/:id/support', protect, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // Get the supporter's ID from the authenticated user

    try {
        const proposal = await Proposal.findByIdAndUpdate(
            id,
            { $addToSet: { supporters: userId } },
            { new: true }
        ).exec();

        if (!proposal) return res.status(404).json({ message: 'Proposal not found.' });

        proposal.supporterCount = proposal.supporters.length;
        await proposal.save();

        res.status(200).json(proposal);
    } catch (error) {
        res.status(500).json({ message: 'Error supporting proposal', error: error.message });
    }
});

module.exports = router;