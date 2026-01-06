import PlayerComponent from './Player.svelte';
import type { RRwebPlayerOptions } from './types';
import { asClassComponent } from 'svelte/legacy';
import '@amplitude/rrweb-replay/dist/style.css';

const LegacyPlayer = asClassComponent(PlayerComponent as any);

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
