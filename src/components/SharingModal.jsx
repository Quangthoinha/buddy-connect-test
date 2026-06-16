import React from 'react';
import { bridge } from '../lib/bridge.js';

export default function SharingModal({
  open,
  onClose,
  isAnyAdmin,
  shareCodeInput,
  setShareCodeInput,
  generatedCode,
  onGenerateCode,
  onRedeemCode,
  shareGrants,
  onRevokeGrant,
  loadingGrants
}) {
  if (!open) return null;

  return (
    <div className="modal-scrim dialog-scrim animated-fade-in" onClick={onClose}>
      <div className="modal-card dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon" style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--brand)' }}>
          ⇆
        </div>
        <h3 className="dialog-title">Kết nối liên-Workspace</h3>
        <p className="dialog-body" style={{ textAlign: 'left', marginBottom: 16 }}>
          Tính năng chia sẻ chéo (superapp mig 049) cho phép thành viên giữa các workspace được liên kết xem thông tin và lập kèo chung cùng nhau!
        </p>

        <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16, textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Nhập mã kết nối nhận chia sẻ</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="mushy-input"
              placeholder="Nhập mã 6 ký tự..."
              value={shareCodeInput}
              onChange={(e) => setShareCodeInput(e.target.value)}
              style={{ textTransform: 'uppercase' }}
            />
            <button
              className="mushy-btn mushy-btn--primary"
              style={{ padding: '0 16px', minHeight: 44 }}
              onClick={() => { bridge.haptic('light'); onRedeemCode?.(); }}
            >
              Gửi
            </button>
          </div>
        </div>

        {isAnyAdmin && (
          <div style={{ borderTop: '1px solid var(--hairline)', marginTop: 18, paddingTop: 16, textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Tạo mã chia sẻ Workspace hiện tại</h4>
            <button
              className="mushy-btn mushy-btn--ghost mushy-btn--block"
              onClick={() => { bridge.haptic('light'); onGenerateCode?.(); }}
            >
              Tạo Mã Kết Nối
            </button>

            {generatedCode && (
              <div style={{ background: 'var(--surface-muted)', borderRadius: 12, padding: 12, marginTop: 10, textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--muted)' }}>Gửi mã này cho Workspace liên kết (Hạn 24h):</p>
                <div style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: 'var(--brand)' }}>{generatedCode.code}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--hairline)', marginTop: 18, paddingTop: 16, textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Các kết nối chia sẻ hiện tại</h4>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
              <span className="mushy-spinner" />
            </div>
          ) : shareGrants.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>Chưa có kết nối chia sẻ chéo nào.</p>
          ) : (
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              {shareGrants.map(grant => {
                const isOwner = grant.direction === 'as_owner';
                return (
                  <div key={grant.grantId} className="sharing-grant-row">
                    <div className="grant-info">
                      <span className={`grant-direction-tag ${isOwner ? 'grant-direction-tag--in' : 'grant-direction-tag--out'}`}>
                        {isOwner ? 'Phát chia sẻ' : 'Nhận chia sẻ'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--ink)' }}>
                        {isOwner ? grant.followerWorkspaceName : grant.ownerWorkspaceName}
                      </span>
                    </div>
                    <button
                      className="mushy-btn mushy-btn--ghost"
                      style={{ padding: '4px 10px', minHeight: 30, fontSize: 11, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => { bridge.haptic('medium'); onRevokeGrant?.(grant.grantId); }}
                    >
                      Xóa
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-actions" style={{ marginTop: 20 }}>
          <button className="mushy-btn mushy-btn--ghost mushy-btn--block" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
