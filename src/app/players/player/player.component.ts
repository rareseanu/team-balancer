import { Component, OnInit, Input } from '@angular/core';
import { Player } from 'src/app/shared/player.model';
import { PlayersService } from 'src/app/shared/players.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  @Input() player: Player;
  @Input() isCurrentlySelected: boolean;

  constructor(private playersSvc: PlayersService) {
  }

  ngOnInit() {
  }


  onSelected() {
    this.playersSvc.playerSelected.emit(this.player);
  }
}
