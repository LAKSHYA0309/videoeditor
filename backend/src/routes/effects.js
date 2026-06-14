import express from 'express'

const router = express.Router()

router.get('/', (req, res) => res.json([]))
router.post('/', (req, res) => res.status(201).json({ id: 'effect-1' }))
router.delete('/:id', (req, res) => res.json({ success: true }))

export default router
