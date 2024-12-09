import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  initializeApp({
    credential: admin.credential.applicationDefault(), 
    // Or use service account from environment variables
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { prompt, uid } = req.body;
  if (!prompt || !uid) return res.status(400).send('Missing prompt or uid');

  // Verify user and free_generations
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(400).send('User not found');
  const userData = userSnap.data();
  if (userData.free_generations <= 0) return res.status(403).send('No free gens left');

  // Call ComfyUI on RunPod
  // Assume you have COMFYUI_ENDPOINT env var in Vercel
  const workflow = {/* load your workflow.json here or have a template object */};
  // Insert the prompt into workflow nodes
  for (let node of workflow.nodes) {
    if (node.class_type === 'CLIPTextEncode') {
      node.inputs.text = prompt;
    }
  }

  try {
    const comfyRes = await axios.post(`${process.env.COMFYUI_ENDPOINT}/v1/run_workflow`, workflow);
    const result = comfyRes.data;

    // result should contain info about where images were saved
    // If you have PanoramaEater saving to S3 or you handle upload after generation,
    // you'll need a mechanism to retrieve the final URLs.
    // For now, assume your node saves to S3 and returns URLs in result.

    res.status(200).json({ status: 'ok', panorama: result.panorama_url });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error calling ComfyUI');
  }
}
