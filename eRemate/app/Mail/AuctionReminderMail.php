<?php

namespace App\Mail;

use App\Models\Subasta; 
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AuctionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public Subasta $subasta;
    public string $nombreRematador;

    public function __construct(Subasta $subasta, string $nombreRematador)
    {
        $this->subasta = $subasta;
        $this->nombreRematador = $nombreRematador;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Recordatorio: Tu subasta comienza pronto - ID: ' . $this->subasta->id,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.auctions.reminder',
            with: [
                'fechaInicio' => $this->subasta->fechaInicio->format('d/m/Y H:i'),
                'subasta' => $this->subasta,
                'nombreRematador' => $this->nombreRematador,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
