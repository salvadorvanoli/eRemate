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

    /**
     * Create a new message instance.
     */
    public function __construct(Subasta $subasta, string $nombreRematador)
    {
        $this->subasta = $subasta;
        $this->nombreRematador = $nombreRematador;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Recordatorio: Tu subasta comienza pronto - ID: ' . $this->subasta->id,
        );
    }

    /**
     * Get the message content definition.
     */
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

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
