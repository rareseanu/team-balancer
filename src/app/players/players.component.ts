import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MatchService } from '../shared/match.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styles: ['']
})
export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[];
  selectedPlayer: Player;
  editMode: boolean;
  playerSelectSubscription: Subscription;
  playerDataChangeSubscription: Subscription;
  searchedName = '';

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private matchesSvc: MatchService,
    private router: Router,
    private route: ActivatedRoute) {
    this.selectedPlayer = null;
    this.editMode = false;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers();

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
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
  }

  public onNewPlayerClicked($event): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  public onSavePlayerClicked($event): void {
    this.playersSvc.saveAllPlayers();
  }

  public async onConvertRatingClicked($event) {
    // Reset player ratings.
    for(let player of this.playersSvc.getPlayers()) {
      player.rating = 5;
    }
    this.playersSvc.saveAllPlayers();

    // Delete all rating documents.
    await this.playersSvc.dropPlayerRatings();

    // Create rating entries again, based on the matches whose results were applied.
    let recentMatchNames = [...this.matchesSvc.getRecentMatchListCached()];
    recentMatchNames.forEach(matchName => {
      this.matchesSvc.getMatchForDateAsync(matchName).subscribe((customGame: CustomPrevGame) => {
        
        if(customGame.appliedResults) {
          const newPlayers = this.playersSvc.updateRatingsForGame(
            this.playersSvc.getPlayers(), customGame
          );

          this.playersSvc.savePlayersToList(this.playersSvc.getPlayers(), matchName);
          this.playersSvc.savePlayersToList(newPlayers, 'current');

        }
      });
    })

  }

  onSearchContentChange($event) {
    // try to apply the target value.
    const filteredPlayers = filterPlayerArray(this.players, $event.target.value);
    if (filteredPlayers.length === 1) {
      // show special marker?
    }
  }
}
