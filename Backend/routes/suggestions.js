const express = require('express');
const { z } = require('zod');
const validateRequest = require('../middleware/validateRequest')
const { generateSuggestions, chatResponse } = require('../Controllers/suggestions');

const router = express.Router();
const suggestionSchema = z.object({
  body: z.object({
    transcript: z.array(z.string()).min(1, 'Transcript must contain at least one string'),
    prompt: z.string().optional(),
    model: z.string().optional()
  })
})


router.post('/generate', validateRequest(suggestionSchema), generateSuggestions);
router.post('/chat', chatResponse);

module.exports = router;
