import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, formatViews, sanitizeFilename, isValidYouTubeUrl, isPlaylistUrl, parseJobId } from '../src/utils.js';

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(3600), '60:00');
  assert.equal(formatDuration(null), '0:00');
});

test('formatViews', () => {
  assert.equal(formatViews(1500), '1.5K views');
  assert.equal(formatViews(2500000), '2.5M views');
  assert.equal(formatViews(0), '1M+ views');
});

test('sanitizeFilename strips illegal chars and caps length', () => {
  assert.equal(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j'), 'a_b_c_d_e_f_g_h_i_j');
  assert.equal(sanitizeFilename('x'.repeat(500)).length, 100);
  assert.equal(sanitizeFilename(''), 'TubeDeck_Media');
});

test('isValidYouTubeUrl accepts only YouTube hosts', () => {
  assert.equal(isValidYouTubeUrl('https://www.youtube.com/watch?v=abc123'), true);
  assert.equal(isValidYouTubeUrl('https://youtu.be/abc123'), true);
  assert.equal(isValidYouTubeUrl('https://music.youtube.com/watch?v=abc'), true);
  assert.equal(isValidYouTubeUrl('https://m.youtube.com/watch?v=abc'), true);
  assert.equal(isValidYouTubeUrl('http://www.youtube.com/watch?v=abc'), true); // http allowed

  assert.equal(isValidYouTubeUrl('https://evil.com/watch?v=abc'), false);
  assert.equal(isValidYouTubeUrl('https://youtube.com.evil.com/'), false);
  assert.equal(isValidYouTubeUrl('file:///etc/passwd'), false);
  assert.equal(isValidYouTubeUrl('https://localhost:5000/x'), false);
  assert.equal(isValidYouTubeUrl('not a url'), false);
  assert.equal(isValidYouTubeUrl(''), false);
  assert.equal(isValidYouTubeUrl(null), false);
});

test('isPlaylistUrl', () => {
  assert.equal(isPlaylistUrl('https://www.youtube.com/playlist?list=PL123'), true);
  assert.equal(isPlaylistUrl('https://www.youtube.com/watch?v=abc&list=PL1'), true);
  assert.equal(isPlaylistUrl('https://www.youtube.com/watch?v=abc'), false);
});

test('parseJobId', () => {
  assert.equal(parseJobId('job_1678123456789_123.mp4'), 'job_1678123456789');
  assert.equal(parseJobId('other.txt'), null);
});
