import PlayerComponent from './Player.svelte';
import type { RRwebPlayerOptions } from './types';
import { asClassComponent } from 'svelte/legacy';
import '@amplitude/rrweb-replay/dist/style.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LegacyPlayer = asClassComponent(PlayerComponent as any);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Player extends (LegacyPlayer as unknown as { new (o: any): any }) {
  constructor(
    options: { data?: RRwebPlayerOptions['props'] } & RRwebPlayerOptions,
  ) {
    super({
      target: options.target,
      props: options.data ?? options.props,
    });
  }
}

export default Player;
