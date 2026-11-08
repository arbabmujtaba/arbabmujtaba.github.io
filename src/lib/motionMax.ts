// Its own module so the bundler can split domMax into a separate chunk; a
// dynamic import of 'motion/react' itself would pin the whole package (and
// every feature) into the entry bundle.
export { domMax as default } from 'motion/react';
