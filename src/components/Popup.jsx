'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import './Popup.css';

const positionClass = {
  center: 'popup-position-center',
  left: 'popup-position-left',
  right: 'popup-position-right',
  bottom: 'popup-position-bottom',
};

function normalizePopupList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(Boolean);
}

export default function Popup() {
  const [popupItems, setPopupItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/settings?type=popup')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setPopupItems(normalizePopupList(data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPopupItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const safeActiveIndex = activeIndex >= popupItems.length ? 0 : activeIndex;
  const currentPopup = popupItems[safeActiveIndex];
  const hasMultiple = popupItems.length > 1;
  const positionName = currentPopup?.position || 'center';
  const overlayClassName = positionClass[positionName] || positionClass.center;

  const trackStyle = useMemo(
    () => ({ transform: `translateX(-${safeActiveIndex * 100}%)` }),
    [safeActiveIndex]
  );

  if (!currentPopup) {
    return null;
  }

  const closePopup = () => {
    setPopupItems([]);
    setActiveIndex(0);
  };

  const moveToSlide = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= popupItems.length) {
      return;
    }

    setActiveIndex(nextIndex);
  };

  return (
    <div className={`popup-overlay ${overlayClassName}`}>
      <div className="popup-window liquid-glass">
        <button type="button" className="popup-close-btn" onClick={closePopup} aria-label="팝업 닫기">
          ×
        </button>

        <div className="popup-header">
          <div>
            <p className="popup-kicker">Popup Alert</p>
            <h3 className="popup-title">{currentPopup.title || '안내 팝업'}</h3>
          </div>
              {hasMultiple && (
            <div className="popup-counter">
              {safeActiveIndex + 1} / {popupItems.length}
            </div>
          )}
        </div>

        <div className="popup-slider">
          <div className="popup-track" style={trackStyle}>
            {popupItems.map((item) => {
              const slideBody = (
                <>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title || '팝업 이미지'}
                      className="popup-image"
                    />
                  )}
                  {item.content && (
                    <div
                      className="popup-body"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  )}
                </>
              );

              return (
                <section key={item.id} className="popup-slide">
                  {item.link_url ? (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="popup-link"
                    >
                      {slideBody}
                    </a>
                  ) : (
                    slideBody
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <div className="popup-footer">
          {hasMultiple ? (
            <div className="popup-navigation">
              <button
                type="button"
                onClick={() => moveToSlide(safeActiveIndex - 1)}
                disabled={safeActiveIndex === 0}
                className="popup-nav-button"
              >
                이전
              </button>
              <div className="popup-dots">
                {popupItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => moveToSlide(index)}
                    className={`popup-dot ${index === safeActiveIndex ? 'is-active' : ''}`}
                    aria-label={`${index + 1}번 팝업 보기`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => moveToSlide(safeActiveIndex + 1)}
                disabled={safeActiveIndex === popupItems.length - 1}
                className="popup-nav-button"
              >
                다음
              </button>
            </div>
          ) : (
            <span className="popup-hint">현재 노출 중인 알림입니다.</span>
          )}

          <button type="button" onClick={closePopup} className="popup-confirm-button">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
