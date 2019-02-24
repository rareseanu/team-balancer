import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[];
  selectedPlayer: Player;
  editMode: boolean;
  playerSelectSubscription: Subscription;
  playerDataChangeSubscription: Subscription;

  constructor(private playersSvc: PlayersService, private router: Router, private route: ActivatedRoute) {
    this.selectedPlayer = null;
    this.editMode = false;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers();
    this.playerSelectSubscription = this.playersSvc.playerSelectedEvent
      .subscribe(
        (player: Player) => {
          console.log('selected: ' + player.name);
          this.selectedPlayer = player;
        }
      );

    this.playerDataChangeSubscription = this.playersSvc.playerDataChangeEvent
      .subscribe(
        (player: Player) => {
          console.log('player change');
          if (player == null) {
            // reload all
            this.players = this.playersSvc.getPlayers();
          } else {
            // reload single player only.
            this.players = this.playersSvc.getPlayers();
          }
        }
      );
  }

  ngOnDestroy() {
    if (this.playerSelectSubscription) {
      this.playerSelectSubscription.unsubscribe();
    }
    if (this.playerDataChangeSubscription) {
      this.playerDataChangeSubscription.unsubscribe();
    }
  }

  public canAddPlayers(): boolean {
    return true;
  }

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
  }


  public onNewPlayerClicked($event): void {
    console.log('new player clicked', $event);
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  public onEditPlayerClicked($event): void {
    console.log('edit player clicked', $event);
    // this.editMode = true;
    this.router.navigate([this.selectedPlayer.id, 'edit'], { relativeTo: this.route });
  }

  public onSavePlayerClicked($event): void {
    console.log('save player clicked');
    this.playersSvc.saveAllPlayers();
  }
}
